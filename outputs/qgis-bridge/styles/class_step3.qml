<!DOCTYPE qgis PUBLIC 'http://mrcc.com/qgis.dtd' 'SYSTEM'>
<qgis version="3.28.0" styleCategories="AllStyleCategories" maxScale="0" minScale="1e+08" hasScaleBasedVisibilityFlag="0">
  <flags>
    <Identifiable>1</Identifiable>
    <Removable>1</Removable>
    <Searchable>1</Searchable>
    <Private>0</Private>
  </flags>
  <pipe>
    <provider>
      <resampling enabled="false" maxOversampling="2" zoomedInResamplingMethod="nearestNeighbour" zoomedOutResamplingMethod="nearestNeighbour"/>
    </provider>
    <rasterrenderer type="paletted" opacity="1" alphaBand="-1" band="1" nodataColor="">
      <rasterTransparency/>
      <minMaxOrigin>
        <limits>None</limits>
        <extent>WholeRaster</extent>
        <statAccuracy>Estimated</statAccuracy>
        <cumulativeCutLower>0.02</cumulativeCutLower>
        <cumulativeCutUpper>0.98</cumulativeCutUpper>
        <stdDevFactor>2</stdDevFactor>
      </minMaxOrigin>
      <colorPalette>
        <paletteEntry value="1" color="#7a1f1f" label="1 STOP built-up" alpha="255"/>
        <paletteEntry value="2" color="#1a4f8a" label="2 STOP open water" alpha="255"/>
        <paletteEntry value="3" color="#1f6b3a" label="3 Existing mangrove" alpha="255"/>
        <paletteEntry value="4" color="#c4a35a" label="4 CAUTION tidal flat" alpha="255"/>
        <paletteEntry value="5" color="#b35c1e" label="5 CAUTION other converted" alpha="255"/>
        <paletteEntry value="6" color="#6db347" label="6 GO inactive pond" alpha="255"/>
        <paletteEntry value="7" color="#e0a21b" label="7 CAUTION active pond" alpha="255"/>
        <paletteEntry value="8" color="#0099aa" label="8 GO open/accreted" alpha="255"/>
        <paletteEntry value="9" color="#8b6bb3" label="9 CAUTION history unproven" alpha="255"/>
        <paletteEntry value="10" color="#d9d9d9" label="10 STOP outside tidal frame" alpha="255"/>
      </colorPalette>
      <colorramp type="randomcolors" name="[source]"/>
    </rasterrenderer>
    <brightnesscontrast brightness="0" contrast="0" gamma="1"/>
    <huesaturation colorizeGreen="128" colorizeOn="0" colorizeRed="255" colorizeBlue="128" grayscaleMode="0" saturation="0" colorizeStrength="100"/>
    <rasterresampler maxOversampling="2"/>
  </pipe>
  <blendMode>0</blendMode>
</qgis>
