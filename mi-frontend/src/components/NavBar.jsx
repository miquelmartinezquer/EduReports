import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import fetchWithAuth from "../utils/fetchWithAuth";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/sonner";

function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState([]);
  const [showInvitations, setShowInvitations] = useState(false);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const [processingInvitationId, setProcessingInvitationId] = useState(null);

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

  const mapAcceptInvitationError = (rawMessage) => {
    const message = (rawMessage || "").toLowerCase();

    if (message.includes("invitación no encontrada")) {
      return "La invitació no existeix";
    }
    if (message.includes("no tens permís per acceptar aquesta invitació")) {
      return "No tens permís per acceptar aquesta invitació";
    }
    if (message.includes("aquesta invitació ja no està pendent")) {
      return "Aquesta invitació ja no esta pendent";
    }

    return rawMessage || "No s'ha pogut acceptar la invitació";
  };

  const mapDeclineInvitationError = (rawMessage) => {
    const message = (rawMessage || "").toLowerCase();

    if (message.includes("invitación no encontrada")) {
      return "La invitació no existeix";
    }
    if (message.includes("no tens permís per declinar aquesta invitació")) {
      return "No tens permís per declinar aquesta invitació";
    }
    if (message.includes("aquesta invitació ja no està pendent")) {
      return "Aquesta invitació ja no esta pendent";
    }

    return rawMessage || "No s'ha pogut declinar la invitació";
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleAcceptInvitation = async (invitationId) => {
    const parsedInvitationId = Number(invitationId);
    if (!Number.isInteger(parsedInvitationId) || parsedInvitationId <= 0) {
      toast.error(`ID d'invitació no vàlid: ${invitationId}`);
      return;
    }

    try {
      setProcessingInvitationId(parsedInvitationId);
      await fetchWithAuth(`/invitations/accept/${parsedInvitationId}`, {
        method: "POST",
      });
      setInvitations((prev) =>
        prev.map((invitation) => {
          const id = invitation.id ?? invitation.invitationId;
          return id === parsedInvitationId
            ? { ...invitation, status: "accepted" }
            : invitation;
        }),
      );
      window.dispatchEvent(new CustomEvent("shared-courses-updated"));
      setShowInvitations(false);
      toast.success("Invitació acceptada correctament");
    } catch (error) {
      console.error("Error acceptant invitació:", error);
      toast.error(mapAcceptInvitationError(error.message));
    } finally {
      setProcessingInvitationId(null);
    }
  };

  const handleDeclineInvitation = async (invitationId) => {
    const parsedInvitationId = Number(invitationId);
    if (!Number.isInteger(parsedInvitationId) || parsedInvitationId <= 0) {
      toast.error(`ID d'invitació no vàlid: ${invitationId}`);
      return;
    }

    try {
      setProcessingInvitationId(parsedInvitationId);
      await fetchWithAuth(`/invitations/decline/${parsedInvitationId}`, {
        method: "POST",
      });

      setInvitations((prev) =>
        prev.map((invitation) => {
          const id = invitation.id ?? invitation.invitationId;
          return id === parsedInvitationId
            ? { ...invitation, status: "rejected" }
            : invitation;
        }),
      );

      toast.success("Invitació declinada");
    } catch (error) {
      console.error("Error declinant invitació:", error);
      toast.error(mapDeclineInvitationError(error.message));
    } finally {
      setProcessingInvitationId(null);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 mb-1">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="flex items-center hover:opacity-80 transition-opacity cursor-pointer"
        >
          <img
            src="/logo-hortizontal.png"
            alt="EduReports"
            className="h-8 w-auto"
          />
        </button>

        <div className="flex items-center gap-4 relative">
          <div
            className="relative"
            onMouseEnter={() => setShowInvitations(true)}
            onMouseLeave={() => setShowInvitations(false)}
          >
            <Button
              variant="ghost"
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
            </Button>

            {showInvitations && (
              <div className="absolute right-0 top-full pt-2 z-50 w-[22rem]">
                <div className="bg-white border border-gray-200 rounded-xl shadow-lg">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-semibold text-gray-900">Invitacions</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Gestiona les invitacions pendents
                    </p>
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
                        const normalizedInvitationId = Number(invitationId);

                        const courseLabel =
                          invitation.courseName ||
                          `Curs #${invitation.courseId}`;
                        const inviter = invitation.inviterName;

                        return (
                          <div
                            key={invitationId}
                            className="px-4 py-3 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                              <p className="text-sm font-medium text-gray-900 leading-5">
                                {inviter
                                  ? `${inviter} t'ha convidat a col·laborar al curs:`
                                  : "Tens una invitació al curs:"}
                              </p>
                              <p className="text-sm text-indigo-700 font-semibold mt-1">
                                {courseLabel}
                              </p>
                              {invitation.courseLevel && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Nivell: {invitation.courseLevel}
                                </p>
                              )}

                              <div className="mt-3 flex gap-2">
                                <Button
                                  onClick={() =>
                                    handleAcceptInvitation(invitationId)
                                  }
                                  size="sm"
                                  variant="success"
                                  disabled={
                                    processingInvitationId ===
                                    normalizedInvitationId
                                  }
                                  className="flex-1"
                                >
                                  Acceptar
                                </Button>
                                <Button
                                  onClick={() =>
                                    handleDeclineInvitation(invitationId)
                                  }
                                  size="sm"
                                  variant="outline"
                                  disabled={
                                    processingInvitationId ===
                                    normalizedInvitationId
                                  }
                                  className="flex-1"
                                >
                                  Declinar
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="text-sm">
            <p className="font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
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
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tancar sessio?</AlertDialogTitle>
                <AlertDialogDescription>
                  Es tancara la teva sessio actual i hauràs de tornar a iniciar
                  sessio.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel·lar</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout}>
                  Si, tancar sessio
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
