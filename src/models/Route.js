// src/models/Route.js

import Place from './Place.js';

export default class Route {
  constructor({
    type = 'ROUTE_CAR',
    start = null,
    goal = null,
    waypoint = [],
  } = {}) {
    this.type = type;

    this.start =
      start instanceof Place
        ? start
        : new Place(start ?? {});

    this.goal =
      goal instanceof Place
        ? goal
        : new Place(goal ?? {});

    this.waypoint = waypoint.map((item) =>
      item instanceof Place
        ? item
        : new Place(item)
    );
  }

  get hasStart() {
    return this.start?.hasLocation ?? false;
  }

  get hasGoal() {
    return this.goal?.hasLocation ?? false;
  }

  get isReady() {
    return this.hasStart && this.hasGoal;
  }

  static from(data) {
    return new Route(data);
  }
}