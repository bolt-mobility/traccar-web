/*
 * Copyright 2015 - 2017 Anton Tananaev (anton@traccar.org)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

Ext.define('Traccar.view.map.MapController', {
    extend: 'Traccar.view.map.MapMarkerController',
    alias: 'controller.map',

    requires: [
        'Traccar.GeofenceConverter',
        'Traccar.model.Location'
    ],

    config: {
        listen: {
            controller: {
                '*': {
                    mapstaterequest: 'getMapState',
                    zoomtoalldevices: 'zoomToAllDevices'
                }
            },
            store: {
                '#Geofences': {
                    load: 'updateGeofences',
                    add: 'updateGeofences',
                    update: 'updateGeofences',
                    remove: 'updateGeofences'
                }
            }
        }
    },

    init: function () {
        this.callParent();
        this.lookupReference('showReportsButton').setVisible(
            Traccar.app.isMobile() && !Traccar.app.getBooleanAttributePreference('ui.disableReport'));
        this.lookupReference('showEventsButton').setVisible(
            Traccar.app.isMobile() && !Traccar.app.getBooleanAttributePreference('ui.disableEvents'));
        var storage = Ext.util.LocalStorage.get('id');
        var latest = storage.getItem("latest");
        if(latest) Ext.getStore("LocationSearches").loadData(JSON.parse(latest), false);
    },

    showReports: function () {
        Traccar.app.showReports(true);
    },

    showEvents: function () {
        Traccar.app.showEvents(true);
    },

    searchAddress: function (value) {
        console.log(value.value);
        if(!value.value) {
            var storage = Ext.util.LocalStorage.get('id');
            var latest = storage.getItem("latest");
            if(latest) Ext.getStore("LocationSearches").loadData(JSON.parse(latest), false);
        } else {
            rootView = this.getView()
            Ext.Ajax.request({
                url: 'https://nominatim.openstreetmap.org/search/' + value.value,
                method: 'GET',
                timeout: 60000,
                params:
                    {
                        format: 'json'
                    },
                headers:
                    {
                        'Content-Type': 'application/json'
                    },
                success: function (response) {
                    var json = JSON.parse(response.responseText);
                    Ext.getStore("LocationSearches").loadData(json, false);

                },
                failure: function (response) {
                    Ext.Msg.alert('Status', 'Request Failed.');

                }
            })
        }
    },
    onAddressSelect: function (combo, record) {
        var storage = Ext.util.LocalStorage.get('id');
        var latest = storage.getItem("latest");
        if(!latest) {
            latest = []
        } else {
            latest = JSON.parse(latest);
            if(latest.length > 10) {
                latest = latest.slice(0,9)
            }
        }
        console.log(latest[0].place_id, record.data.place_id)
        if(latest[0].place_id != record.data.place_id) {
            latest.unshift(record.data);
            storage.setItem("latest", JSON.stringify(latest));
        }

        rootView.getMapView().setCenter(ol.proj.fromLonLat([
            Number(record.data.lon),
            Number(record.data.lat)
        ]));

    },

    onFollowClick: function (button, pressed) {
        if (pressed && this.selectedMarker) {
            this.getView().getMapView().setCenter(this.selectedMarker.getGeometry().getCoordinates());
        }
    },

    showLiveRoutes: function (button) {
        this.getView().getLiveRouteLayer().setVisible(button.pressed);
    },

    getMapState: function () {
        var zoom, center, projection;
        projection = this.getView().getMapView().getProjection();
        center = ol.proj.transform(this.getView().getMapView().getCenter(), projection, 'EPSG:4326');
        zoom = this.getView().getMapView().getZoom();
        this.fireEvent('mapstate', center[1], center[0], zoom);
    },

    updateGeofences: function () {
        this.getView().getGeofencesSource().clear();
        if (this.lookupReference('showGeofencesButton').pressed) {
            Ext.getStore('Geofences').each(function (geofence) {
                var feature = new ol.Feature(
                    Traccar.GeofenceConverter.wktToGeometry(this.getView().getMapView(), geofence.get('area')));
                feature.setStyle(this.getAreaStyle(
                    geofence.get('name'), geofence.get('attributes') ? geofence.get('attributes').color : null));
                this.getView().getGeofencesSource().addFeature(feature);
                return true;
            }, this);
        }
    },

    zoomToAllDevices: function () {
        this.zoomToAllPositions(Ext.getStore('LatestPositions').getData().items);
    }
});
