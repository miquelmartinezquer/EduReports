import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import fetchWithAuth from "../utils/fetchWithAuth";

function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState([]);
  const [showInvitations, setShowInvitations] = useState(false);
  const [loadingInvitations, setLoadingInvitations] = useState(false);

  const pendingInvitations = invitations.filter(
    (invitation) => invitation.status === "pending",
  );

  const loadInvitations = async () => {
    if (!user?.id) return;

    try {
      setLoadingInvitations(true);
      const data = await fetchWithAuth(`/invitations/${user.id}`);
      setInvitations(Array.isArray(data.invitations) ? data.invitations : []);
    } catch (error) {
      console.error("Error carregant invitacions:", error);
      setInvitations([]);
    } finally {
      setLoadingInvitations(false);
    }
  };

  useEffect(() => {
    loadInvitations();
  }, [user?.id]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleAcceptInvitation = async (invitationId) => {
    const parsedInvitationId = Number(invitationId);
    if (!Number.isInteger(parsedInvitationId) || parsedInvitationId <= 0) {
      alert(`ID d'invitació no vàlid ${invitationId}`);
      return;
    }

    try {
      await fetchWithAuth(`/invitations/accept/${parsedInvitationId}`, {
        method: "POST",
      });
      window.location.reload();
    } catch (error) {
      console.error("Error acceptant invitació:", error);
      alert(error.message || "No s'ha pogut acceptar la invitació");
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 mb-1.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <span className="font-semibold text-gray-900">
            Sistema d'Informes
          </span>
        </div>

        <div className="flex items-center gap-4 relative">
          <div className="relative">
            <button
              onClick={() => setShowInvitations((prev) => !prev)}
              className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {pendingInvitations.length > 0 && (
                <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-xs font-semibold">
                  {pendingInvitations.length}
                </span>
              )}
            </button>

            {showInvitations && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-semibold text-gray-900">Invitacions</p>
                </div>

                <div className="max-h-80 overflow-auto">
                  {loadingInvitations ? (
                    <p className="px-4 py-3 text-sm text-gray-500">
                      Carregant...
                    </p>
                  ) : pendingInvitations.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-gray-500">
                      No tens invitacions pendents
                    </p>
                  ) : (
                    pendingInvitations.map((invitation) => {
                      const invitationId =
                        invitation.id ?? invitation.invitationId;

                      const courseLabel =
                        invitation.courseName || `Curs #${invitation.courseId}`;
                      const inviter = invitation.inviterName;

                      return (
                        <div
                          key={invitationId}
                          className="px-4 py-3 border-b border-gray-100 last:border-b-0"
                        >
                        <p className="text-sm font-medium text-gray-900">
                          {inviter
                            ? `${inviter} t'ha convidat a col·laborar al curs: ${courseLabel}`
                            : courseLabel}
                        </p>
                        {invitation.courseLevel && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            Nivell: {invitation.courseLevel}
                          </p>
                        )}
                        <button
                          onClick={() => handleAcceptInvitation(invitationId)}
                          className="mt-2 px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
                        >
                          Acceptar
                        </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="text-sm">
            <p className="font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Sortir
          </button>
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
