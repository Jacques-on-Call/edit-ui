import { z } from 'zod';

/**
 * Defines the schema for the 'style' properties of a block.
 * This is kept flexible to accommodate any valid CSS-in-JS properties.
 * We use `z.record(z.string())` to allow any string key with a string value.
 */
const StylePropsSchema = z.record(z.string());

/**
 * Defines the schema for the 'content' properties of a block.
 * This is kept flexible (`z.record(z.any())`) because each block
 * (e.g., Hero, TextBlock) will have its own unique content shape.
 */
const ContentPropsSchema = z.record(z.any());

/**
 * Defines the Zod schema for the props of a single, generic block.
 * It enforces the separation of style and content, a key architectural
 * principle of this layout builder.
 *
 * This schema can be extended for specific components to provide
 * more granular validation. For example, a HeroBlock's content
 * schema might require a `title` and a `subtitle`.
 */
export const BlockPropsSchema = z.object({
  style: StylePropsSchema.default({}),
  content: ContentPropsSchema.default({}),
});

/**
 * Example of how to extend for a specific component.
 * This is for demonstration and not used yet.
 */
export const HeroBlockPropsSchema = BlockPropsSchema.extend({
  content: z.object({
    title: z.string().default('Default Title'),
    subtitle: z.string().optional(),
  }),
});