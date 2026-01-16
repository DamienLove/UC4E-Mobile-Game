
import { NodeType } from '../types';

const BASE_STYLE = "8k resolution, photorealistic, unreal engine 5 render, cinematic lighting, volumetric raytracing, isolated on black background, macro photography, ultra-detailed textures.";

export const getNodeImagePrompt = (nodeType: NodeType): string => {
    switch (nodeType) {
        case 'player_consciousness':
            return `A hyper-realistic sphere of pure psionic energy. A swirling vortex of cyan and magenta liquid starlight, glowing intensely from the core. Complex fractal energy tendrils arcing off the surface. ${BASE_STYLE}`;
        case 'star':
            return `A blindingly bright main-sequence star. Violent yellow and orange solar flares erupting from the spherical surface. Realistic sunspots and granulation visible on the photosphere. Corona glowing with intense heat. ${BASE_STYLE}`;
        case 'rocky_planet':
            return `A highly detailed rocky exoplanet viewed from space. Ultra-realistic surface textures showing canyons, craters, and mountain ranges. Terracotta and grey mineral colors. Dynamic lighting with a sharp terminator line. ${BASE_STYLE}`;
        case 'life_seed':
            return `A wet, life-bearing planetoid. Deep blue oceans swirling with bioluminescent green algae blooms. White cloud formations spiraling in a thick atmosphere. Realistic water reflections and atmospheric scattering. ${BASE_STYLE}`;
        case 'sentient_colony':
            return `A technological ecumenopolis planet. The entire surface is covered in geometric, glowing city lights in purple and gold. intricate orbital elevators and lattice megastructures visible against the dark side. Cyberpunk aesthetic, hyper-complex details. ${BASE_STYLE}`;
        default:
            return `A mysterious cosmic artifact sphere, shimmering with unknown energy. ${BASE_STYLE}`;
    }
}
