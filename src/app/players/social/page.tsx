import { SocialViewManager } from "@/components/players/SocialViewManager";
import { getPlayers } from "@/lib/data";

export default async function SocialPage() {
    const players = await getPlayers();

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="relative z-10">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                    Mapa de Relaciones
                </h1>
                <p className="text-slate-400 mt-2">
                    Vínculos, rivalidades y química del plantel.
                </p>
            </div>

            <SocialViewManager players={players} />
        </div>
    );
}
