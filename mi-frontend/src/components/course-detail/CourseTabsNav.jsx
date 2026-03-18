import { Button } from "@/components/ui/button";

function CourseTabsNav({
  activeTab,
  onChangeTab,
  course,
  totalItemsCount,
  templatesCount = 0,
}) {
  return (
    <div className="mb-6 bg-white rounded-lg shadow">
      <div className="flex border-b">
        <Button
          onClick={() => onChangeTab("classes")}
          variant="ghost"
          className={`flex-1 px-6 py-4 font-semibold transition-colors rounded-none ${
            activeTab === "classes"
              ? "text-indigo-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Classes ({course.classes?.length || 0})
        </Button>
        <Button
          onClick={() => onChangeTab("collaborators")}
          variant="ghost"
          className={`flex-1 px-6 py-4 font-semibold transition-colors rounded-none ${
            activeTab === "collaborators"
              ? "text-indigo-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Col·laboradors ({course.collaborators?.length || 0})
        </Button>
        <Button
          onClick={() => onChangeTab("items")}
          variant="ghost"
          className={`flex-1 px-6 py-4 font-semibold transition-colors rounded-none ${
            activeTab === "items"
              ? "text-indigo-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Items ({totalItemsCount})
        </Button>
        <Button
          onClick={() => onChangeTab("templates")}
          variant="ghost"
          className={`flex-1 px-6 py-4 font-semibold transition-colors rounded-none ${
            activeTab === "templates"
              ? "text-indigo-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Plantilles ({templatesCount})
        </Button>
      </div>
    </div>
  );
}

export default CourseTabsNav;
