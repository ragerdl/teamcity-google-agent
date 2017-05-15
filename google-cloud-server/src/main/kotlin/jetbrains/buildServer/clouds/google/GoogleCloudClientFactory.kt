/*
 * Copyright 2000-2017 JetBrains s.r.o.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package jetbrains.buildServer.clouds.google

import jetbrains.buildServer.clouds.*
import jetbrains.buildServer.clouds.base.AbstractCloudClientFactory
import jetbrains.buildServer.clouds.base.errors.TypedCloudErrorInfo
import jetbrains.buildServer.clouds.google.connector.GoogleApiConnectorImpl
import jetbrains.buildServer.serverSide.AgentDescription
import jetbrains.buildServer.serverSide.PropertiesProcessor
import jetbrains.buildServer.serverSide.ServerSettings
import jetbrains.buildServer.web.openapi.PluginDescriptor
import java.util.*

/**
 * Constructs Google cloud clients.
 */
class GoogleCloudClientFactory(cloudRegistrar: CloudRegistrar,
                               private val myPluginDescriptor: PluginDescriptor,
                               private val mySettings: ServerSettings,
                               private val myImagesHolder: GoogleCloudImagesHolder)
    : AbstractCloudClientFactory<GoogleCloudImageDetails, GoogleCloudClient>(cloudRegistrar) {

    override fun createNewClient(state: CloudState,
                                 images: Collection<GoogleCloudImageDetails>,
                                 params: CloudClientParameters): GoogleCloudClient {
        return createNewClient(state, params, arrayOf<TypedCloudErrorInfo>())
    }

    override fun createNewClient(state: CloudState,
                                 params: CloudClientParameters,
                                 errors: Array<TypedCloudErrorInfo>): GoogleCloudClient {
        val accessKey = getParameter(params, GoogleConstants.ACCESS_KEY)
        val apiConnector = GoogleApiConnectorImpl(accessKey)
        apiConnector.setServerId(mySettings.serverUUID)
        apiConnector.setProfileId(state.profileId)

        val cloudClient = GoogleCloudClient(params, apiConnector, myImagesHolder)
        cloudClient.updateErrors(*errors)

        return cloudClient
    }

    private fun getParameter(params: CloudClientParameters, parameter: String): String {
        return params.getParameter(parameter) ?: throw RuntimeException(parameter + " must not be empty")
    }

    override fun parseImageData(params: CloudClientParameters): Collection<GoogleCloudImageDetails> {
        return GoogleUtils.parseImageData(GoogleCloudImageDetails::class.java, params)
    }

    override fun checkClientParams(params: CloudClientParameters): Array<TypedCloudErrorInfo>? {
        return emptyArray()
    }

    override fun getCloudCode(): String {
        return "google"
    }

    override fun getDisplayName(): String {
        return "Google Compute"
    }

    override fun getEditProfileUrl(): String? {
        return myPluginDescriptor.getPluginResourcesPath("settings.html")
    }

    override fun getInitialParameterValues(): Map<String, String> {
        return emptyMap()
    }

    override fun getPropertiesProcessor(): PropertiesProcessor {
        return PropertiesProcessor { properties ->
            properties.keys
                    .filter { SKIP_PARAMETERS.contains(it) }
                    .forEach { properties.remove(it) }

            emptyList()
        }
    }

    override fun canBeAgentOfType(description: AgentDescription): Boolean {
        return description.configurationParameters.containsKey(GoogleAgentProperties.INSTANCE_NAME)
    }

    companion object {
        private val SKIP_PARAMETERS = Arrays.asList(CloudImageParameters.SOURCE_ID_FIELD)
    }
}