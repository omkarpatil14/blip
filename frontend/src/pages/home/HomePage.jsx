import { useState, lazy, Suspense } from "react";
import LoadingSpinner from "../../components/common/LoadingSpinner";

// Lazy load your components
const Posts = lazy(() => import("../../components/common/Posts"));
const CreatePost = lazy(() => import("./CreatePost"));

const HomePage = () => {
  const [feedType, setFeedType] = useState("forYou");

  return (
    <div className="flex-[4_4_0] mr-auto border-r border-gray-800 min-h-screen bg-gray-900 text-gray-300">
      {/* Header */}
      <div className="flex w-full border-b border-gray-800">
        <div
          className={`flex justify-center flex-1 p-3 hover:bg-gray-700 transition duration-300 cursor-pointer relative ${
            feedType === "forYou" ? "text-blue-500" : ""
          }`}
          onClick={() => setFeedType("forYou")}
        >
          For you
          {feedType === "forYou" && (
            <div className="absolute bottom-0 w-10 h-1 rounded-full bg-blue-500"></div>
          )}
        </div>
        <div
          className={`flex justify-center flex-1 p-3 hover:bg-gray-700 transition duration-300 cursor-pointer relative ${
            feedType === "following" ? "text-blue-500" : ""
          }`}
          onClick={() => setFeedType("following")}
        >
          Following
          {feedType === "following" && (
            <div className="absolute bottom-0 w-10 h-1 rounded-full bg-blue-500"></div>
          )}
        </div>
      </div>

      {/* Lazy load CreatePost component */}
      <Suspense fallback={<LoadingSpinner size="lg" />}>
        <CreatePost />
      </Suspense>

      {/* Lazy load Posts component */}
      <Suspense fallback={<LoadingSpinner size="lg" />}>
        <Posts feedType={feedType} />
      </Suspense>
    </div>
  );
};

export default HomePage;
