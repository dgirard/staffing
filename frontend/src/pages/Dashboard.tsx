import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { api } from '../services/api';
import { StatCard } from '../components/StatCard';
import { Card } from '../components/Card';
import type { DashboardStats } from '../types';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    if (!user) return;

    setLoading(true);
    let response;

    switch (user.role) {
      case 'consultant':
        response = await api.getDashboardMe();
        break;
      case 'project_owner':
        response = await api.getDashboardOwner(user.id);
        break;
      case 'administrator':
        response = await api.getDashboardAdmin();
        break;
      case 'directeur':
        response = await api.getDashboardDirecteur();
        break;
    }

    if (response?.success && response.data) {
      setStats(response.data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  const getRoleTitle = () => {
    const titles = {
      consultant: 'Dashboard Consultant',
      project_owner: 'Dashboard Chef de Projet',
      administrator: 'Dashboard Administrateur',
      directeur: 'Dashboard Directeur',
    };
    return titles[user?.role || 'consultant'];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {getRoleTitle()}
          </h1>
          <p className="text-gray-600">
            Bienvenue {user?.prenom} {user?.nom}
          </p>
        </div>

        {/* Stats Grid - Consultant */}
        {user?.role === 'consultant' && stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard
                title="Jours saisis ce mois"
                value={stats.jours_mois || 0}
                icon="📅"
              />
              <StatCard
                title="Projets actifs"
                value={stats.nb_projets || 0}
                icon="🎯"
              />
              <StatCard
                title="Taux d'utilisation"
                value={`${stats.taux_util || 0}%`}
                icon="📊"
                trend={stats.taux_util ? {
                  value: stats.taux_util - 75,
                  isPositive: stats.taux_util >= 75
                } : undefined}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="Mes projets actifs">
                {stats.projets && stats.projets.length > 0 ? (
                  <ul className="space-y-2">
                    {stats.projets.map((projet: any, index: number) => (
                      <li key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <span className="font-medium">{projet.nom}</span>
                        <span className="text-sm text-gray-600">{projet.client}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">Aucun projet actif</p>
                )}
              </Card>

              <Card title="Saisies de la semaine">
                {stats.semaine && stats.semaine.length > 0 ? (
                  <ul className="space-y-2">
                    {stats.semaine.map((entry: any, index: number) => (
                      <li key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <span>{new Date(entry.date).toLocaleDateString('fr-FR')}</span>
                        <span className="font-medium">{entry.temps_saisi}j</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">Aucune saisie cette semaine</p>
                )}
              </Card>
            </div>
          </>
        )}

        {/* Stats Grid - Project Owner */}
        {user?.role === 'project_owner' && stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard
                title="Validations en attente"
                value={stats.nb_validations_pending || 0}
                icon="⏳"
              />
              <StatCard
                title="Projets gérés"
                value={stats.nb_projets || 0}
                icon="📁"
              />
              <StatCard
                title="Budget total"
                value={`${stats.budget_total || 0}€`}
                icon="💰"
              />
            </div>
          </>
        )}

        {/* Stats Grid - Administrator */}
        {user?.role === 'administrator' && stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Consultants"
                value={stats.nb_consultants || 0}
                icon="👥"
              />
              <StatCard
                title="Projets actifs"
                value={stats.nb_projets || 0}
                icon="🎯"
              />
              <StatCard
                title="Conflits"
                value={stats.nb_conflicts || 0}
                icon="⚠️"
              />
              <StatCard
                title="Capacité dispo"
                value={`${stats.capacite_dispo || 0}%`}
                icon="📊"
              />
            </div>
          </>
        )}

        {/* Stats Grid - Directeur */}
        {user?.role === 'directeur' && stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Consultants"
                value={stats.nb_consultants || 0}
                icon="👥"
              />
              <StatCard
                title="Projets actifs"
                value={stats.nb_projets || 0}
                icon="🎯"
              />
              <StatCard
                title="Conflits"
                value={stats.nb_conflicts || 0}
                icon="⚠️"
              />
              <StatCard
                title="Capacité dispo"
                value={`${stats.capacite_dispo || 0}%`}
                icon="📊"
              />
            </div>

            {stats.marges && stats.marges.length > 0 && (
              <Card title="Marges projets (CJR - Accès Directeur uniquement)">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-yellow-800 text-sm">
                    ⚠️ Cet accès aux coûts réels (CJR) est audité conformément aux règles de confidentialité
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Projet</th>
                        <th className="text-right py-2">Budget</th>
                        <th className="text-right py-2">Coût CJN</th>
                        <th className="text-right py-2">Coût CJR</th>
                        <th className="text-right py-2">Marge</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.marges.map((marge: any, index: number) => (
                        <tr key={index} className="border-b">
                          <td className="py-2">{marge.nom}</td>
                          <td className="text-right">{marge.budget}€</td>
                          <td className="text-right">{marge.cout_cjn}€</td>
                          <td className="text-right font-medium">{marge.cout_cjr}€</td>
                          <td className={`text-right font-bold ${marge.marge_cjr > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {marge.marge_cjr}€
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
