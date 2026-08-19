# Kanto Canvas

# ROLE: Elite Frontend UI/UX Engineer & WebGL Expert.
# PROJECT: "Kanto Memory" - A premium 3D node-based UI interface.
# TECH STACK: React, Tailwind CSS, @react-three/fiber, @react-three/drei, and d3-force-3d.

# 1. VISUAL CONSTITUTION (STRICT AXIOMS)
- Colors: ONLY pure black (`#000000`) for the background. UI elements use Kanto Cream (`#F5F5DC`) and White (`#FFFFFF`). NO gradients, NO shadows, NO 3D bevels.
- UI Styling: Flat design. 8px border-radius for panels. 1px solid `#333333` borders.
- Typography: Use 'Playfair Display' (Italic) for the main logo/brand text. Use 'Inter' for UI data.

# 2. UI LAYOUT REQUIREMENTS
- Full-screen black canvas taking 100% of the viewport.
- Bottom Center: A sleek, minimalist "Record" button (Microphone icon) with a pure `#000000` background, a 1px `#F5F5DC` border, and white icon. When active, change border to `#FFFFFF`.
- Right Side Panel: A hidden-by-default details panel. When a node is clicked, it slides in. It has a pure black background, 1px `#333333` border, displaying a Title (Category) and Body Text (The idea).
- Top Left: The wordmark "Kanto Memory" in Playfair Display Italic, colored in Kanto Cream.

# 3. 3D CANVAS & NODE GRAPH (THE VISUAL MOCKUP)
- Use `@react-three/fiber` for the 3D scene. Include `<OrbitControls>` for 360-degree panning and zooming.
- FLAT 2D AXIOM: Nodes must be 2D planes/sprites (using `<Billboard>`) floating in 3D space. Do NOT use 3D spheres. 
- Links: Connect nodes with flat 2D lines (`THREE.LineBasicMaterial`).
- Node Styling: 
  - Core Node (Center): Large, `#FFFFFF`.
  - Category Nodes: Medium, `#F5F5DC` (80% opacity), connected to Core.
  - Idea Nodes: Small, `#FFFFFF` (40% opacity), connected to Categories.
- Generate a static "mock data" structure (1 Core -> 3 Categories -> a few Ideas) and render it using a force-directed layout algorithm (like d3-force-3d) so they spread out organically without overlapping.

Generate the complete React application focusing purely on a flawless, high-performance visual experience and UI interactions.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c5d1b249-ad90-487d-8d5c-efc63703c6a1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
