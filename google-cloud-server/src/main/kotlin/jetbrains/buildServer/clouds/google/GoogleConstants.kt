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

import jetbrains.buildServer.agent.Constants
import jetbrains.buildServer.clouds.CloudImageParameters

/**
 * Google cloud constants.
 */
class GoogleConstants {

    val accessKey: String
        get() = ACCESS_KEY

    val sourceImage: String
        get() = SOURCE_IMAGE

    val zone: String
        get() = ZONE

    val maxInstancesCount: String
        get() = MAX_INSTANCES_COUNT

    val network: String
        get() = NETWORK_ID

    val machineType: String
        get() = MACHINE_TYPE

    val vmNamePrefix: String
        get() = CloudImageParameters.SOURCE_ID_FIELD

    val imagesData: String
        get() = CloudImageParameters.SOURCE_IMAGES_JSON

    val agentPoolId: String
        get() = CloudImageParameters.AGENT_POOL_ID_FIELD

    companion object {
        const val ACCESS_KEY = Constants.SECURE_PROPERTY_PREFIX + "accessKey"
        const val SOURCE_IMAGE = "sourceImage"
        const val ZONE = "zone"
        const val NETWORK_ID = "network"
        const val MAX_INSTANCES_COUNT = "maxInstances"
        const val MACHINE_TYPE = "machineType"
        const val TAG_SERVER = "teamcityServer"
        const val TAG_DATA = "teamcityData"
        const val TAG_PROFILE = "teamcityProfile"
        const val TAG_SOURCE = "teamcitySource"
        const val PROFILE_ID = "profileId"
    }
}