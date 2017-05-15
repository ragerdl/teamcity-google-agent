/*
 * Copyright 2000-2017 JetBrains s.r.o.
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

function GoogleImagesViewModel($, ko, baseUrl, dialog) {
    var self = this;

    self.loadingResources = ko.observable(false);
    self.errorResources = ko.observable("");

    // Credentials
    self.credentials = ko.validatedObservable({
        accessKey: ko.observable().extend({required: true})
    });

    self.isValidCredentials = ko.pureComputed(function () {
        return self.credentials().accessKey.isValid();
    });

    // Image details
    var maxLength = 12;
    self.image = ko.validatedObservable({
        sourceImage: ko.observable().extend({required: true}),
        zone: ko.observable().extend({required: true}),
        network: ko.observable().extend({required: true}),
        maxInstances: ko.observable(1).extend({required: true, min: 1}),
        machineType: ko.observable().extend({required: true}),
        vmNamePrefix: ko.observable('').trimmed().extend({required: true, maxLength: maxLength}).extend({
            validation: {
                validator: function (value) {
                    return self.originalImage && self.originalImage['source-id'] === value ||
                        self.sourceImages().every(function(image) {
                            return image['source-id'] !== value;
                        });
                },
                message: 'Name prefix should be unique within subscription'
            }
        }).extend({
            pattern: {
                message: 'Name can contain alphanumeric characters, underscore and hyphen',
                params: /^[a-z][a-z0-9_-]*$/i
            }
        }),
        agentPoolId: ko.observable().extend({required: true}),
        profileId: ko.observable()
    });

    // Data from APIs
    self.sourceImages = ko.observableArray([]);
    self.zones = ko.observableArray([]);
    self.networks = ko.observableArray([]);
    self.machineTypes = ko.observableArray([]);
    self.agentPools = ko.observableArray([]);

    // Hidden fields for serialized values
    self.images_data = ko.observable();

    // Deserialized values
    self.images = ko.observableArray();

    // Reload info on credentials change
    self.credentials().accessKey.subscribe(function (accessKey) {
        if (!accessKey) return;

        self.loadInfo();
    });

    self.image().sourceImage.subscribe(function (image) {
        if (!image) return;

        // Fill in vm name prefix
        if (self.image().vmNamePrefix()) return;
        var vmName = image.slice(-maxLength);
        self.image().vmNamePrefix(vmName);
    });

    self.images_data.subscribe(function (data) {
        var images = ko.utils.parseJson(data || "[]");
        self.images(images);
    });

    // Dialogs
    self.originalImage = null;

    self.showDialog = function (data) {
        self.originalImage = data;

        var model = self.image();
        var image = data || {maxInstances: 1};

        model.sourceImage(image.sourceImage);
        model.zone(image.zone);
        model.network(image.network);
        model.machineType(image.machineType);
        model.maxInstances(image.maxInstances);
        model.vmNamePrefix(image['source-id']);
        model.agentPoolId(image.agent_pool_id);
        model.profileId(image.profileId);

        self.image.errors.showAllMessages(false);
        dialog.showDialog(!self.originalImage);

        return false;
    };

    self.closeDialog = function () {
        dialog.close();
        return false;
    };

    self.saveImage = function () {
        var model = self.image();
        var image = {
            sourceImage: model.sourceImage(),
            zone: model.zone(),
            network: model.network(),
            maxInstances: model.maxInstances(),
            'source-id': model.vmNamePrefix(),
            machineType: model.machineType(),
            agent_pool_id: model.agentPoolId(),
            profileId: model.profileId()
        };

        var originalImage = self.originalImage;
        if (originalImage) {
            self.images.replace(originalImage, image);
        } else {
            self.images.push(image);
        }
        self.images_data(JSON.stringify(self.images()));

        dialog.close();
        return false;
    };

    self.deleteImage = function (image) {
        var message = "Do you really want to delete agent image based on " + image.image + "?";
        var remove = confirm(message);
        if (!remove) {
            return false;
        }

        self.images.remove(image);
        saveImages();

        return false;
    };

    self.loadInfo = function () {
        var accessKey = self.credentials().accessKey();
        if (!accessKey) return;

        self.loadingResources(true);

        var url = getBasePath() +
            "&resource=zones" +
            "&resource=networks" +
            "&resource=machineTypes" +
            "&resource=images";

        $.post(url, {
            "prop:secure:accessKey": accessKey
        }).then(function (response) {
            var $response = $j(response);
            var errors = getErrors($response);
            if (errors) {
                self.errorResources(errors);
                return;
            } else {
                self.errorResources("");
            }

            self.sourceImages(getSourceImages($response));
            self.zones(getZones($response));
            self.machineTypes(getMachineTypes($response));
            self.networks(getNetworks($response));
        }, function (error) {
            self.errorResources("Failed to load data: " + error.message);
            console.log(error);
        }).always(function () {
            self.loadingResources(false);
        });
    };

    function saveImages() {
        var images = self.images();
        self.images_data(JSON.stringify(images));
    }

    function getBasePath() {
        return baseUrl + "?";
    }

    function getErrors($response) {
        var $errors = $response.find("errors:eq(0) error");
        if ($errors.length) {
            return $errors.text();
        }

        return "";
    }

    function getZones($response) {
        return $response.find("zones:eq(0) zone").map(function () {
            return {id: $(this).attr("id"), text: $(this).text()};
        }).get();
    }

    function getNetworks($response) {
        return $response.find("networks:eq(0) network").map(function () {
            return {id: $(this).attr("id"), text: $(this).text()};
        }).get();
    }

    function getMachineTypes($response) {
        return $response.find("machineTypes:eq(0) machineType").map(function () {
            return {id: $(this).attr("id"), text: $(this).text()};
        }).get();
    }

    function getSourceImages($response) {
        return $response.find("images:eq(0) image").map(function () {
            return {id: $(this).attr("id"), text: $(this).text()};
        }).get();
    }

    (function loadAgentPools() {
        var url = baseUrl + "?resource=agentPools";
        return $.post(url).then(function (response) {
            var $response = $j(response);
            var errors = getErrors($response);
            if (errors) {
                self.errorResources(errors);
                return;
            } else {
                self.errorResources("");
            }

            var agentPools = $response.find("agentPools:eq(0) agentPool").map(function () {
                return {
                    id: $(this).attr("id"),
                    text: $(this).text()
                };
            }).get();

            self.agentPools(agentPools);
            self.image().agentPoolId.valueHasMutated();
        }, function (error) {
            self.errorResources("Failed to load data: " + error.message);
            console.log(error);
        });
    })();
}