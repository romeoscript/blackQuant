import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

/**
 * Central GSAP setup. Register plugins exactly once here and import gsap
 * from this module (not straight from "gsap") so plugins are always ready.
 * `registerPlugin` is a no-op on the server, so this is safe to import
 * anywhere; actual animations must still run in client components.
 */
gsap.registerPlugin(ScrollTrigger, useGSAP);

export { gsap, ScrollTrigger, useGSAP };
