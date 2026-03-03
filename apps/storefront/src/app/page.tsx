export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold text-gray-900">TakeApp</h1>
        <p className="text-gray-500">
          Accedé al menú de tu negocio en{" "}
          <code className="bg-gray-100 px-1 rounded">
            /[nombre-del-negocio]
          </code>
        </p>
      </div>
    </div>
  );
}
