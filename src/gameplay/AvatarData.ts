export interface AvatarDefinition {
    id: string;
    name: string;
    title: string;
    description: string;
    type: "3d" | "sprite";
    primaryColor: string;
    accentColor: string;
    spriteSrc?: string;
    stats: {
        agility: string;
        style: string;
    };
}

export const AVATARS: AvatarDefinition[] = [
    {
        id: "cyber-kid",
        name: "NEO-RUNNER",
        title: "Agile Cyber Kid",
        description: "Lightweight cyberpunk runner with neural visor and high-frequency athletic articulation.",
        type: "3d",
        primaryColor: "#00ffff",
        accentColor: "#00aaff",
        stats: { agility: "98%", style: "Cyberpunk Classic" }
    },
    {
        id: "cyber-shinobi",
        name: "KAGE-X",
        title: "Shadow Shinobi",
        description: "Stealth operative equipped with low-friction exoskeleton armor and crimson energy visor.",
        type: "3d",
        primaryColor: "#ff007f",
        accentColor: "#9d4edd",
        stats: { agility: "95%", style: "Stealth Tech" }
    },
    {
        id: "titan-mech",
        name: "TITAN-V",
        title: "Vanguard Exosuit",
        description: "Reinforced chassis powered by dual neon servo motors and golden power-core conduits.",
        type: "3d",
        primaryColor: "#ffd700",
        accentColor: "#ff8800",
        stats: { agility: "90%", style: "Heavy Armored" }
    },
    {
        id: "retro-hero",
        name: "RETRO HERO",
        title: "Pixel Operative",
        description: "Classic stylized operative utilizing local digital sprite projection in 3D perspective.",
        type: "sprite",
        primaryColor: "#00ff88",
        accentColor: "#00ffff",
        spriteSrc: "/src/assets/hero.png",
        stats: { agility: "92%", style: "Retro Hologram" }
    }
];

export const DEFAULT_AVATAR_ID = "cyber-kid";

export function getSavedAvatarId(): string {
    try {
        const saved = localStorage.getItem("neon_runner_avatar");
        if (saved && AVATARS.some(a => a.id === saved)) {
            return saved;
        }
    } catch {
        // LocalStorage disabled or unavailable
    }
    return DEFAULT_AVATAR_ID;
}

export function saveAvatarId(id: string): void {
    try {
        localStorage.setItem("neon_runner_avatar", id);
    } catch {
        // Ignore storage errors
    }
}
