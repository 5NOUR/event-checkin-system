import { Router } from "express";
import { authenticateToken, requireRole } from "../../middleware/auth";
import { Role } from "@prisma/client";
import * as contentController from "../../controllers/contentController";
import { validate } from "../../middleware/validate";
import {
  createSpeakerSchema,
  updateSpeakerSchema,
  createAgendaSchema,
  updateAgendaSchema,
  createFaqSchema,
  updateFaqSchema,
  createSponsorSchema,
  updateSponsorSchema,
  createGalleryImageSchema,
  createGateSchema,
  updateGateSchema,
  createTicketTypeSchema,
  updateTicketTypeSchema,
} from "../../validators/content.validator";
import {
  uuidParamSchema,
  eventIdParamSchema,
} from "../../validators/common.validator";

const router = Router();

router.use(authenticateToken);
router.use(requireRole([Role.ORGANIZER, Role.ADMIN]));

// ===== المتحدثون =====
router.get(
  "/event/:eventId/speakers",
  validate({ params: eventIdParamSchema }),
  contentController.getSpeakers,
);
router.post(
  "/event/:eventId/speakers",
  validate({ params: eventIdParamSchema, body: createSpeakerSchema }),
  contentController.createSpeaker,
);
router.put(
  "/speakers/:id",
  validate({ params: uuidParamSchema, body: updateSpeakerSchema }),
  contentController.updateSpeaker,
);
router.delete(
  "/speakers/:id",
  validate({ params: uuidParamSchema }),
  contentController.deleteSpeaker,
);

// ===== الأجندة =====
router.get(
  "/event/:eventId/agenda",
  validate({ params: eventIdParamSchema }),
  contentController.getAgendaItems,
);
router.post(
  "/event/:eventId/agenda",
  validate({ params: eventIdParamSchema, body: createAgendaSchema }),
  contentController.createAgendaItem,
);
router.put(
  "/agenda/:id",
  validate({ params: uuidParamSchema, body: updateAgendaSchema }),
  contentController.updateAgendaItem,
);
router.delete(
  "/agenda/:id",
  validate({ params: uuidParamSchema }),
  contentController.deleteAgendaItem,
);

// ===== الأسئلة الشائعة =====
router.get(
  "/event/:eventId/faqs",
  validate({ params: eventIdParamSchema }),
  contentController.getFaqs,
);
router.post(
  "/event/:eventId/faqs",
  validate({ params: eventIdParamSchema, body: createFaqSchema }),
  contentController.createFaq,
);
router.put(
  "/faqs/:id",
  validate({ params: uuidParamSchema, body: updateFaqSchema }),
  contentController.updateFaq,
);
router.delete(
  "/faqs/:id",
  validate({ params: uuidParamSchema }),
  contentController.deleteFaq,
);

// ===== الشركاء =====
router.get(
  "/event/:eventId/sponsors",
  validate({ params: eventIdParamSchema }),
  contentController.getSponsors,
);
router.post(
  "/event/:eventId/sponsors",
  validate({ params: eventIdParamSchema, body: createSponsorSchema }),
  contentController.createSponsor,
);
router.put(
  "/sponsors/:id",
  validate({ params: uuidParamSchema, body: updateSponsorSchema }),
  contentController.updateSponsor,
);
router.delete(
  "/sponsors/:id",
  validate({ params: uuidParamSchema }),
  contentController.deleteSponsor,
);

// ===== معرض الصور =====
router.get(
  "/event/:eventId/gallery",
  validate({ params: eventIdParamSchema }),
  contentController.getGalleryImages,
);
router.post(
  "/event/:eventId/gallery",
  validate({ params: eventIdParamSchema, body: createGalleryImageSchema }),
  contentController.createGalleryImage,
);
router.delete(
  "/gallery/:id",
  validate({ params: uuidParamSchema }),
  contentController.deleteGalleryImage,
);

// ===== البوابات =====
router.get(
  "/event/:eventId/gates",
  validate({ params: eventIdParamSchema }),
  contentController.getGates,
);
router.post(
  "/event/:eventId/gates",
  validate({ params: eventIdParamSchema, body: createGateSchema }),
  contentController.createGate,
);
router.put(
  "/gates/:id",
  validate({ params: uuidParamSchema, body: updateGateSchema }),
  contentController.updateGate,
);
router.delete(
  "/gates/:id",
  validate({ params: uuidParamSchema }),
  contentController.deleteGate,
);
router.put("/gates/:gateId/ticket-types", contentController.setGateTicketTypes);

// ===== أنواع التذاكر =====
router.get(
  "/event/:eventId/ticket-types",
  validate({ params: eventIdParamSchema }),
  contentController.getTicketTypes,
);
router.post(
  "/event/:eventId/ticket-types",
  validate({ params: eventIdParamSchema, body: createTicketTypeSchema }),
  contentController.createTicketType,
);
router.put(
  "/ticket-types/:id",
  validate({ params: uuidParamSchema, body: updateTicketTypeSchema }),
  contentController.updateTicketType,
);
router.delete(
  "/ticket-types/:id",
  validate({ params: uuidParamSchema }),
  contentController.deleteTicketType,
);

export default router;
