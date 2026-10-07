// src/models/Place.js

export default class Place {
  constructor({
    id = null,
    type = 'PLACE_POI',
    name = '',
    address = '',
    latitude = null,
    longitude = null,
    updateTime = null,
  } = {}) {
    this.id = id;
    this.type = type;
    this.name = name;
    this.address = address;
    this.latitude = latitude;
    this.longitude = longitude;
    this.updateTime = updateTime;
  }

  get hasLocation() {
    return this.latitude !== null && this.longitude !== null;
  }

  get coordinate() {
    return {
      lat: this.latitude,
      lng: this.longitude,
    };
  }

  static from(data) {
    return new Place(data); 
  }
}