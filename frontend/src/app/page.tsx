import Image from "next/image";
import DocumentUpload from "./components/DocumentUpload";
import DocumentList from "./components/DocumentList";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4 flex items-center">
          <h1 className="ml-4 text-xl font-semibold">AI For Education</h1>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Document Management</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <DocumentUpload />
          </div>
          
          <div className="md:col-span-2">
            <DocumentList />
          </div>
        </div>
      </main>
    </div>
  );
}
