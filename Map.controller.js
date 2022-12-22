sap.ui.define([
    "sap/ui/core/mvc/Controller"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller) {
        "use strict";
        var clientId = <client_id>;
        var clientSecret = <client_secret>;
        var oAuthUrl = <oauth_url>;
        var accessToken = "";
        var refreshToken = function () {
            // var authorizationBasic = $.base64.btoa(clientId + ':' + clientSecret);
            var authorizationBasic = window.btoa(clientId + ':' + clientSecret);

            jQuery.ajax({
                type: 'POST',
                url: oAuthUrl,
                data: { grant_type: 'client_credentials' },
                dataType: "json",
                contentType: 'application/x-www-form-urlencoded; charset=utf-8',
                xhrFields: {
                    withCredentials: false
                },
                crossDomain: true,
                headers: {
                    'Authorization': 'Basic ' + authorizationBasic
                },
                //beforeSend: function (xhr) {
                //},
                success: function (result) {
                    accessToken = result.access_token;
                    //getTileGeoMap(result.access_token);
                    getTileGeoMap(accessToken);
                },
                //complete: function (jqXHR, textStatus) {
                //},
                error: function (req, status, error) {
                    alert(error);
                }
            });
        }

        //Use this approach or similar when it comes to automated testing
        function getTile(accessToken) {
            jQuery.ajax({
                'url': 'https://spatialservices.cfapps.eu10.hana.ondemand.com/mapping/v1/here/tiles/basetile/newest/normal.day/4/8/5/256/png',
                'type': 'GET',
                'crossDomain': 'true',
                mimeType: "text/plain; charset=x-user-defined",
                xhrFields: {
                    'withCredentials': false
                },
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('Accept', '*/*');
                    xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
                },
                'success': function (data) {
                    //Process success actions
                    document.getElementById("response").value = data;
                    document.getElementById("targetImage").src = "data:image/png;base64," + base64Encode(data);
                    return data;
                },
                'error': function (XMLHttpRequest, textStatus, errorThrown) {
                    //Process error action
                    switch (XMLHttpRequest.status) {
                        case "400":
                            // bad request
                            document.getElementById("response").value = JSON.stringify("400:bad request");
                            break;
                        case "401":
                            // unauthorized
                            document.getElementById("response").value = JSON.stringify("401:unauthorized");
                            break;
                        case "403":
                            // forbidden
                            document.getElementById("response").value = JSON.stringify("403:forbidden");
                            break;
                        default:
                            //Something bad happened
                            document.getElementById("response").value = JSON.stringify(XMLHttpRequest.status + ":" + XMLHttpRequest.statusText);
                            break;
                    }
                    return false;
                }
            });
        }

        //From: https://stackoverflow.com/questions/19124701/get-image-using-jquery-ajax-and-decode-it-to-base64
        function base64Encode(str) {
            var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
            var out = "", i = 0, len = str.length, c1, c2, c3;
            while (i < len) {
                c1 = str.charCodeAt(i++) & 0xff;
                if (i == len) {
                    out += CHARS.charAt(c1 >> 2);
                    out += CHARS.charAt((c1 & 0x3) << 4);
                    out += "==";
                    break;
                }
                c2 = str.charCodeAt(i++);
                if (i == len) {
                    out += CHARS.charAt(c1 >> 2);
                    out += CHARS.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
                    out += CHARS.charAt((c2 & 0xF) << 2);
                    out += "=";
                    break;
                }
                c3 = str.charCodeAt(i++);
                out += CHARS.charAt(c1 >> 2);
                out += CHARS.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
                out += CHARS.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
                out += CHARS.charAt(c3 & 0x3F);
            }
            return out;
        }

        function getTileGeoMap(accessToken) {
            var mapTileServerUrl = "https://spatialservices.cfapps.eu10.hana.ondemand.com/mapping/v1/here/tiles/maptile/newest/normal.day/{LOD}/{X}/{Y}/256/png";
            var oMapConfigHeaders = {
                "MapProvider": [
                    {
                        "name": "HEADERS_TEST",
                        "type": "",
                        "description": "",
                        "copyright": "Tiles Courtesy of Test",
                        "Header": [
                            {
                                "name": "Accept",
                                "value": "*/*"
                            },
                            {
                                "name": "Authorization",
                                "value": "Bearer " + accessToken
                            }
                        ],
                        "Source": [
                            {
                                "id": "s1",
                                "url": mapTileServerUrl
                            }
                        ]
                    }
                ],
                "MapLayerStacks": [
                    {
                        "name": "Default",
                        "MapLayer": [
                            {
                                "name": "HEADERS_TEST",
                                "refMapProvider": "HEADERS_TEST"
                            }
                        ]
                    }
                ]
            };

            var oVBI;
            sap.ui.getCore().byId("geoMap");
            if (oVBI == undefined) {
                // create GeoMap
                var page = sap.ui.getCore().byId("application-nsbusinesspartners-display-component---Suppliers--mapcontent");
                oVBI = new sap.ui.vbm.GeoMap({
                    width: "1024px",
                    height: "600px",
                    ariaLabel: "Map",
                    initialPosition: '-150.109291;62.323907;0',
                    initialZoom: '11'
                });
                //VBI.m_bTrace = true;
                oVBI.setMapConfiguration(oMapConfigHeaders);
                oVBI.placeAt("content");
                page.addContent(oVBI);
            } else {
                oVBI.setMapConfiguration(oMapConfigHeaders);
            }
        };
        return Controller.extend("ns.businesspartners.controller.Suppliers", {
            onBeforeRendering: function () {
                if (accessToken && accessToken.length != 0) {
                    getTileGeoMap(accessToken);
                } else {
                    refreshToken();
                }
            }    
        });
    });
