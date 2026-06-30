import { generateComponent } from "../config/lumeAgent.js";
import ExpressError from "../utils/ExpressError.js";
import ApiResponse from "../utils/ApiResponse.js";
import wrapAsync from "../utils/wrapAsync.js";
import Component from "../models/Component.models.js";
import User from "../models/User.models.js";

const GENERATE_COST = 50;

function mapAIServiceError(error) {
  const message = error?.message || "AI generation failed. Please try again.";

  if (/user not found|invalid api key|unauthorized|forbidden/i.test(message)) {
    return new ExpressError(`OpenRouter error: ${message}`, 502);
  }

  return new ExpressError(message, 502);
}

// Build a URL-safe unique slug from a component name.
function buildSlug(name) {
  return (
    String(name || "lume-component")
      .slice(0, 60)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") +
    "-" +
    Date.now().toString(36)
  );
}

// ── Generate a component via the 4-agent pipeline ──
export const generateComponentHandler = wrapAsync(async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    throw new ExpressError("Prompt is required", 400);
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ExpressError("User not found", 404);
  }

  if (user.credits < GENERATE_COST) {
    throw new ExpressError(
      `Insufficient credits. You have ${user.credits} credits, but component generation requires ${GENERATE_COST}.`,
      402,
    );
  }

  let result;
  try {
    result = await generateComponent(prompt);
  } catch (error) {
    throw mapAIServiceError(error);
  }

  if (!result || !result.finalCode || !result.finalCode.trim()) {
    throw new ExpressError("AI generation failed. Please try again.", 502);
  }

  const slug = buildSlug(result.componentName);

  const component = await Component.create({
    user: req.user.id,
    prompt,
    componentName: result.componentName,
    finalCode: result.finalCode,
    specialists: [
      { role: "UI_ARCHITECT", code: result.specialists.uiLayout },
      { role: "MOTION_DESIGNER", code: result.specialists.animationLogic },
      { role: "WEBGL_SPECIALIST", code: result.specialists.webglCanvas },
    ],
    slug,
  });

  user.credits -= GENERATE_COST;
  await user.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        componentId: component._id,
        componentName: component.componentName,
        finalCode: component.finalCode,
        specialists: component.specialists,
        slug: component.slug,
        credits: user.credits,
        createdAt: component.createdAt,
      },
      "Component generated successfully",
    ),
  );
});

// ── List all components for the authenticated user ──
export const getUserComponents = wrapAsync(async (req, res) => {
  const components = await Component.find({ user: req.user.id })
    .select("componentName slug prompt createdAt updatedAt")
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, components));
});

// ── Fetch a single component by id ──
export const getComponentById = wrapAsync(async (req, res) => {
  const { componentId } = req.params;

  const component = await Component.findById(componentId);
  if (!component) {
    throw new ExpressError("Component not found", 404);
  }

  if (component.user.toString() !== req.user.id.toString()) {
    throw new ExpressError("Unauthorized", 403);
  }

  return res.status(200).json(new ApiResponse(200, component));
});

// ── Delete a component ──
export const deleteComponent = wrapAsync(async (req, res) => {
  const { componentId } = req.params;

  const component = await Component.findById(componentId);
  if (!component) {
    throw new ExpressError("Component not found", 404);
  }

  if (component.user.toString() !== req.user.id.toString()) {
    throw new ExpressError("Unauthorized", 403);
  }

  await Component.findByIdAndDelete(componentId);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Component deleted successfully"));
});
