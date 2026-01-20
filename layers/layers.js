var wms_layers = [];


        var lyr_GoogleRoad_0 = new ol.layer.Tile({
            'title': 'Google Road',
            'type':'base',
            'opacity': 1.000000,
            
            
            source: new ol.source.XYZ({
            attributions: '&nbsp;&middot; <a href="https://www.google.at/permissions/geoguidelines/attr-guide.html">Map data ©2015 Google</a>',
                url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'
            })
        });

        var lyr_GoogleSatellite_1 = new ol.layer.Tile({
            'title': 'Google Satellite',
            'type':'base',
            'opacity': 1.000000,
            
            
            source: new ol.source.XYZ({
            attributions: '&nbsp;&middot; <a href="https://www.google.at/permissions/geoguidelines/attr-guide.html">Map data ©2015 Google</a>',
                url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'
            })
        });
var format_20231121_cadastre_boischatel_2 = new ol.format.GeoJSON();
var features_20231121_cadastre_boischatel_2 = format_20231121_cadastre_boischatel_2.readFeatures(json_20231121_cadastre_boischatel_2, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_20231121_cadastre_boischatel_2 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_20231121_cadastre_boischatel_2.addFeatures(features_20231121_cadastre_boischatel_2);
var lyr_20231121_cadastre_boischatel_2 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_20231121_cadastre_boischatel_2, 
                style: style_20231121_cadastre_boischatel_2,
                popuplayertitle: '20231121_cadastre_boischatel',
                interactive: true,
                title: '<img src="styles/legend/20231121_cadastre_boischatel_2.png" /> 20231121_cadastre_boischatel'
            });
var format_ZonageMAJnovembre2025_3 = new ol.format.GeoJSON();
var features_ZonageMAJnovembre2025_3 = format_ZonageMAJnovembre2025_3.readFeatures(json_ZonageMAJnovembre2025_3, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_ZonageMAJnovembre2025_3 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_ZonageMAJnovembre2025_3.addFeatures(features_ZonageMAJnovembre2025_3);
var lyr_ZonageMAJnovembre2025_3 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_ZonageMAJnovembre2025_3, 
                style: style_ZonageMAJnovembre2025_3,
                popuplayertitle: 'Zonage MAJ novembre2025',
                interactive: true,
                title: '<img src="styles/legend/ZonageMAJnovembre2025_3.png" /> Zonage MAJ novembre2025'
            });
var group_Archive = new ol.layer.Group({
                                layers: [],
                                fold: 'open',
                                title: 'Archive'});
var group_PLUMobile = new ol.layer.Group({
                                layers: [],
                                fold: 'close',
                                title: 'PLUMobile'});
var group_Zonedossierdetravail = new ol.layer.Group({
                                layers: [lyr_20231121_cadastre_boischatel_2,lyr_ZonageMAJnovembre2025_3,],
                                fold: 'open',
                                title: 'Zone dossier de travail'});
var group_Zonagecartemontage = new ol.layer.Group({
                                layers: [],
                                fold: 'close',
                                title: 'Zonage carte montage'});

lyr_GoogleRoad_0.setVisible(true);lyr_GoogleSatellite_1.setVisible(true);lyr_20231121_cadastre_boischatel_2.setVisible(true);lyr_ZonageMAJnovembre2025_3.setVisible(true);
var layersList = [lyr_GoogleRoad_0,lyr_GoogleSatellite_1,group_Zonedossierdetravail];
lyr_20231121_cadastre_boischatel_2.set('fieldAliases', {'OBJECTID': 'OBJECTID', 'IdLotS': 'IdLotS', 'IdDivision': 'IdDivision', 'NoLot': 'Numéro de lot', 'TypeLot': 'TypeLot', 'TypeCadast': 'TypeCadast', 'Superf': 'Superf', 'Unite': 'Unite', 'IndSuperf': 'IndSuperf', 'SuperfMRN': 'SuperfMRN', 'UniteMRN': 'UniteMRN', 'Orientatio': 'Orientatio', 'Echelle': 'Echelle', 'Feuillet': 'Feuillet', 'Etat': 'Etat', 'Remarques': 'Remarques', 'Source': 'Source', 'IndicTrait': 'IndicTrait', 'IndicCarac': 'IndicCarac', 'DateProduc': 'DateProduc', 'Producteur': 'Producteur', 'shape_Leng': 'shape_Leng', 'shape_Area': 'shape_Area', 'Info info lot — A_Matricule': 'Info info lot — A_Matricule', 'Info info lot — A_No civique de l\'emplacement': 'Info info lot — A_No civique de l\'emplacement', 'Info info lot — A_Nocivique2': 'Info info lot — A_Nocivique2', 'Info info lot — A_No. d\'appartement de l\'emplacement': 'Info info lot — A_No. d\'appartement de l\'emplacement', 'Info info lot — A_Générique': 'Info info lot — A_Générique', 'Info info lot — A_Code de lien de l\'emplacement': 'Info info lot — A_Code de lien de l\'emplacement', 'Info info lot — A_Voie publique de l\'emplacement': 'Info info lot — A_Voie publique de l\'emplacement', 'Info info lot — A_Nombre de logements': 'Info info lot — A_Nombre de logements', 'Info info lot — A_Nombre d\'étages': 'Info info lot — A_Nombre d\'étages', 'Info info lot — A_Date année construction': 'Info info lot — A_Date année construction', 'Info info lot — A_Description réelle ou Estimée': 'Info info lot — A_Description réelle ou Estimée', 'Info info lot — A_Aire d\'étages du bâtiment': 'Info info lot — A_Aire d\'étages du bâtiment', 'Info info lot — A_Code de lien physique': 'Info info lot — A_Code de lien physique', 'Info info lot — A_Description code de lien physique': 'Info info lot — A_Description code de lien physique', 'Info info lot — A_Code d\'utilisation': 'Info info lot — A_Code d\'utilisation', 'Info info lot — A_Description code d\'utilisation': 'Info info lot — A_Description code d\'utilisation', 'Info info lot — A_Frontage_mètre': 'Info info lot — A_Frontage_mètre', 'Info info lot — A_Profondeur_mètre': 'Info info lot — A_Profondeur_mètre', 'Info info lot — A_Superficie_m2': 'Info info lot — A_Superficie_m2', });
lyr_ZonageMAJnovembre2025_3.set('fieldAliases', {'Dominante': 'Dominante', 'Numero': 'Numero', 'Numero_Zon': 'Numero_Zon', 'Référenc': 'Référence', });
lyr_20231121_cadastre_boischatel_2.set('fieldImages', {'OBJECTID': 'Hidden', 'IdLotS': 'Hidden', 'IdDivision': 'Hidden', 'NoLot': 'TextEdit', 'TypeLot': 'Hidden', 'TypeCadast': 'Hidden', 'Superf': 'TextEdit', 'Unite': 'Hidden', 'IndSuperf': 'Hidden', 'SuperfMRN': 'Hidden', 'UniteMRN': 'Hidden', 'Orientatio': 'Hidden', 'Echelle': 'Hidden', 'Feuillet': 'Hidden', 'Etat': 'Hidden', 'Remarques': 'Hidden', 'Source': 'Hidden', 'IndicTrait': 'Hidden', 'IndicCarac': 'Hidden', 'DateProduc': 'Hidden', 'Producteur': 'Hidden', 'shape_Leng': 'Hidden', 'shape_Area': 'Hidden', 'Info info lot — A_Matricule': 'TextEdit', 'Info info lot — A_No civique de l\'emplacement': 'Range', 'Info info lot — A_Nocivique2': 'Range', 'Info info lot — A_No. d\'appartement de l\'emplacement': 'TextEdit', 'Info info lot — A_Générique': 'TextEdit', 'Info info lot — A_Code de lien de l\'emplacement': 'TextEdit', 'Info info lot — A_Voie publique de l\'emplacement': 'TextEdit', 'Info info lot — A_Nombre de logements': 'Range', 'Info info lot — A_Nombre d\'étages': 'Range', 'Info info lot — A_Date année construction': 'TextEdit', 'Info info lot — A_Description réelle ou Estimée': 'TextEdit', 'Info info lot — A_Aire d\'étages du bâtiment': 'TextEdit', 'Info info lot — A_Code de lien physique': 'TextEdit', 'Info info lot — A_Description code de lien physique': 'TextEdit', 'Info info lot — A_Code d\'utilisation': 'Range', 'Info info lot — A_Description code d\'utilisation': 'TextEdit', 'Info info lot — A_Frontage_mètre': 'TextEdit', 'Info info lot — A_Profondeur_mètre': 'TextEdit', 'Info info lot — A_Superficie_m2': 'TextEdit', });
lyr_ZonageMAJnovembre2025_3.set('fieldImages', {'Dominante': 'Hidden', 'Numero': 'Hidden', 'Numero_Zon': 'TextEdit', 'Référenc': 'ExternalResource', });
lyr_20231121_cadastre_boischatel_2.set('fieldLabels', {'NoLot': 'header label - visible with data', 'Superf': 'header label - visible with data', 'Info info lot — A_Matricule': 'header label - visible with data', 'Info info lot — A_No civique de l\'emplacement': 'header label - visible with data', 'Info info lot — A_Nocivique2': 'header label - visible with data', 'Info info lot — A_No. d\'appartement de l\'emplacement': 'header label - visible with data', 'Info info lot — A_Générique': 'header label - visible with data', 'Info info lot — A_Code de lien de l\'emplacement': 'header label - visible with data', 'Info info lot — A_Voie publique de l\'emplacement': 'header label - visible with data', 'Info info lot — A_Nombre de logements': 'header label - visible with data', 'Info info lot — A_Nombre d\'étages': 'header label - visible with data', 'Info info lot — A_Date année construction': 'header label - visible with data', 'Info info lot — A_Description réelle ou Estimée': 'header label - visible with data', 'Info info lot — A_Aire d\'étages du bâtiment': 'header label - visible with data', 'Info info lot — A_Code de lien physique': 'header label - visible with data', 'Info info lot — A_Description code de lien physique': 'header label - visible with data', 'Info info lot — A_Code d\'utilisation': 'header label - visible with data', 'Info info lot — A_Description code d\'utilisation': 'header label - visible with data', 'Info info lot — A_Frontage_mètre': 'header label - visible with data', 'Info info lot — A_Profondeur_mètre': 'header label - visible with data', 'Info info lot — A_Superficie_m2': 'header label - visible with data', });
lyr_ZonageMAJnovembre2025_3.set('fieldLabels', {'Numero_Zon': 'header label - visible with data', 'Référenc': 'header label - visible with data', });
lyr_ZonageMAJnovembre2025_3.on('precompose', function(evt) {
    evt.context.globalCompositeOperation = 'normal';
});