import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import VectorLayer from 'ol/layer/Vector.js';
import Cluster from 'ol/source/Cluster.js';
import VectorSource from 'ol/source/Vector.js';
import { fromLonLat } from 'ol/proj.js';
import Circle from 'ol/style/Circle.js';
import Fill from 'ol/style/Fill.js';
import Icon from 'ol/style/Icon.js';
import Stroke from 'ol/style/Stroke.js';
import Style from 'ol/style/Style.js';
import Text from 'ol/style/Text.js';

import locationIcon from '@/assets/icons/icon-location-mark.svg?url';

const singleStyle = new Style({
  image: new Icon({ src: locationIcon, anchor: [0.5, 1], width: 27 }),
});

function clusterStyle(feature) {
  const count = feature.get('features').length;
  if (count === 1) return singleStyle;
  return new Style({
    image: new Circle({
      radius: count >= 1000 ? 22 : count >= 100 ? 19 : 16,
      fill: new Fill({ color: '#356320' }),
      stroke: new Stroke({ color: '#fff', width: 2 }),
    }),
    text: new Text({
      text: String(count),
      font: '600 12px sans-serif',
      fill: new Fill({ color: '#fff' }),
    }),
  });
}

export function createPlaceClusters(map) {
  const places = new VectorSource({ wrapX: false });
  const clusters = new Cluster({ source: places, distance: 44, minDistance: 14, wrapX: false });
  const styles = new Map();
  const layer = new VectorLayer({
    source: clusters,
    zIndex: 90,
    style: (feature) => {
      const count = feature.get('features').length;
      if (!styles.has(count)) styles.set(count, clusterStyle(feature));
      return styles.get(count);
    },
  });
  map.addLayer(layer);

  let current = [];

  function setMarkers(markers) {
    if (markers.length === current.length && markers.every((marker, index) => {
      const previous = current[index];
      return marker.id === previous.id && marker.lat === previous.lat && marker.lng === previous.lng &&
        marker.data?.categoryCode === previous.data?.categoryCode;
    })) return;

    const projection = map.getView().getProjection();
    const features = markers.map((marker) => new Feature({
      geometry: new Point(fromLonLat([marker.lng, marker.lat], projection)),
      marker,
    }));

    // Replace the batch with the cluster listener detached, then recluster once.
    clusters.setSource(null);
    places.clear(true);
    places.addFeatures(features);
    clusters.setSource(places);
    current = markers;
  }

  function destroy() {
    clusters.setSource(null);
    places.clear(true);
    map.removeLayer(layer);
    styles.clear();
    current = [];
  }

  return { layer, setMarkers, destroy };
}
