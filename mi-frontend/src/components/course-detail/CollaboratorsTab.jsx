import { Button } from "@/components/ui/button";

function CollaboratorsTab({
  course,
  user,
  pendingInvitations,
  onAddCollaborator,
  onDeleteCollaborator,
  onRefreshInvitations,
  onDeletePendingInvitation,
}) {
  return (
    <div>
      <div className="mb-6">
        <Button
          onClick={onAddCollaborator}
          variant="success"
          size="lg"
          className="flex items-center gap-2"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Afegir Col·laborador
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {course.collaborators?.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hi ha col·laboradors encara
            </h3>
            <p className="text-gray-500 text-sm">
              Afegeix el primer col·laborador al curs
            </p>
          </div>
        ) : (
          course.collaborators?.map((collab) => {
            const isOwner = Boolean(collab.isOwner);
            const isCurrentUser = user && collab.userId === user.id;

            return (
              <div
                key={collab.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  {!isOwner &&
                    (isCurrentUser ? (
                      <Button
                        onClick={() => onDeleteCollaborator(collab)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                      >
                        Sortir del curs
                      </Button>
                    ) : (
                      <Button
                        onClick={() => onDeleteCollaborator(collab)}
                        variant="ghost"
                        size="icon-sm"
                        className="text-gray-400 hover:text-red-600 transition-colors"
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </Button>
                    ))}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {collab.name}
                </h3>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm text-indigo-600 font-medium">
                    {collab.role}
                  </p>
                  {isOwner && (
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800"
                      title="Propietari del curs"
                    >
                      <svg
                        className="w-3 h-3 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Propietari
                    </span>
                  )}
                  {isCurrentUser && (
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                      title="Aquest ets tu"
                    >
                      Tu
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{collab.email}</p>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Invitacions Pendents ({pendingInvitations.length})
          </h3>
          <Button
            onClick={onRefreshInvitations}
            variant="outline"
            size="sm"
            className="text-sm px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Actualitzar
          </Button>
        </div>

        {pendingInvitations.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            No hi ha invitacions pendents en aquest curs
          </p>
        ) : (
          <div className="space-y-2">
            {pendingInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {invitation.userName || "Usuari"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {invitation.userEmail}
                  </p>
                </div>

                {course.userId === user?.id && (
                  <Button
                    onClick={() => onDeletePendingInvitation(invitation)}
                    variant="destructive"
                    size="sm"
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                  >
                    Eliminar
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CollaboratorsTab;
