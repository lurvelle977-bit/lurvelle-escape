import { db } from "./db/pool";
import { contentRoutes } from "./http/contentRoutes";
import * as repo from "./repositories/content.repository";
import * as service from "./services/content.service";
import { destinationSchema, experienceSchema, tierSchema } from "./validation/content";

// Admin API handlers for the three managed content sections; the route files only re-export them
export const experienceApi = contentRoutes({
  schema: experienceSchema,
  imageLabel: "Experience picture",
  list: () => repo.listExperiences(db),
  create: service.createExperience,
  edit: service.editExperience,
  toggle: service.toggleExperience,
  remove: service.removeExperience,
});

export const destinationApi = contentRoutes({
  schema: destinationSchema,
  imageLabel: "Destination picture",
  list: () => repo.listDestinations(db),
  create: service.createDestination,
  edit: service.editDestination,
  toggle: service.toggleDestination,
  remove: service.removeDestination,
});

export const tierApi = contentRoutes({
  schema: tierSchema,
  list: () => repo.listTiers(db),
  create: (input) => service.createTier(input),
  edit: (id, input) => service.editTier(id, input),
  toggle: service.toggleTier,
  remove: service.removeTier,
});
