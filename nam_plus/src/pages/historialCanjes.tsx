import React, { useEffect, useState } from "react";

type Redemption = {
  _id: string;
  reward?: {
    imageUrl?: string;
    name?: string;
    restaurantName?: string;
  };
  createdAt: string;
  pointsSpent: number;
  status: "completed" | "pending" | "cancelled" | string;
};

const getMyRedemptions = async (): Promise<Redemption[]> => {
  const response = await fetch("/api/redemptions/me", {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("No se pudo cargar el historial de canjes.");
  }

  const data = await response.json();
  return Array.isArray(data) ? data : data?.redemptions ?? [];
};

export const HistorialCanjes: React.FC = () => {
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRedemptions = async () => {
      try {
        setLoading(true);
        const data = await getMyRedemptions();
        setRedemptions(data);
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar el historial de canjes.");
      } finally {
        setLoading(false);
      }
    };

    fetchRedemptions();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500 animate-pulse">Cargando historial de canjes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg max-w-md mx-auto mt-6">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Historial de Canjes</h2>

      {redemptions.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-500">Aún no has realizado ningún canje de puntos.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {redemptions.map((redemption) => (
            <div
              key={redemption._id}
              className="bg-white shadow-sm hover:shadow transition-shadow rounded-lg p-4 flex items-center justify-between border border-gray-200"
            >
              <div className="flex items-center space-x-4">
                {redemption.reward?.imageUrl ? (
                  <img
                    src={redemption.reward.imageUrl}
                    alt={redemption.reward.name}
                    className="w-16 h-16 object-cover rounded-md border"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center text-gray-400 text-xs">
                    Sin imagen
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">
                    {redemption.reward?.name || "Recompensa no disponible"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {redemption.reward?.restaurantName || "Establecimiento desconocido"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Fecha: {new Date(redemption.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="font-bold text-indigo-600 text-lg">
                  -{redemption.pointsSpent} pts
                </span>
                <div className="mt-1">
                  <span
                    className={`px-2.5 py-1 text-xs rounded-full font-medium inline-block ${
                      redemption.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : redemption.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {redemption.status === "completed"
                      ? "Completado"
                      : redemption.status === "pending"
                      ? "Pendiente"
                      : "Cancelado"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Exportación por defecto opcional para evitar conflictos en main.tsx
export default HistorialCanjes;