/*
 * Copyright 2016 - 2017 Anton Tananaev (anton@traccar.org)
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

Ext.define('Traccar.view.map.GeofenceMapController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.geofenceMap',

    requires: [
        'Traccar.GeofenceConverter',
        'Traccar.model.Location'
    ],

    config: {
        listen: {
            controller: {
                '*': {
                    mapstate: 'setMapState'
                }
            }
        }
    },

    init: function () {
        var storage = Ext.util.LocalStorage.get('id');
        var latest = storage.getItem("latest");
        if (latest) Ext.getStore("LocationSearches").loadData(JSON.parse(latest), false);
    },

    onSaveClick: function (button) {
        var geometry, projection;
        if (this.getView().getFeatures().getLength() > 0) {
            geometry = this.getView().getFeatures().pop().getGeometry();
            projection = this.getView().getMapView().getProjection();
            this.fireEvent('savearea', Traccar.GeofenceConverter.geometryToWkt(projection, geometry));
            button.up('window').close();
        }
    },

    searchAddress: function (value) {
        console.log(value.value);
        if (!value.value) {
            var storage = Ext.util.LocalStorage.get('id');
            var latest = storage.getItem("latest");
            if (latest) Ext.getStore("LocationSearches").loadData(JSON.parse(latest), false);
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
                    console.log(response)
                    Ext.Msg.alert('Status', 'Request Failed.');

                }
            })
        }
    },

    onAddressSelect: function (combo, record) {
        var storage = Ext.util.LocalStorage.get('id');
        var latest = storage.getItem("latest");
        if (!latest) {
            latest = []
        } else {
            latest = JSON.parse(latest);
            if (latest.length > 10) {
                latest = latest.slice(0, 9)
            }
        }
        console.log(latest[0].place_id, record.data.place_id)
        if (latest[0].place_id !== record.data.place_id) {
            latest.unshift(record.data);
            storage.setItem("latest", JSON.stringify(latest));
        }

        rootView.getMapView().setCenter(ol.proj.fromLonLat([
            Number(record.data.lon),
            Number(record.data.lat)
        ]));

    },

    onCancelClick: function (button) {
        button.up('window').close();
    },

    onTypeSelect: function (combo) {
        this.getView().removeInteraction();
        this.getView().addInteraction('Polygon');
    },

    setMapState: function (lat, lon, zoom) {
        this.getView().getMapView().setCenter(ol.proj.fromLonLat([lon, lat]));
        this.getView().getMapView().setZoom(zoom);
    }
});
