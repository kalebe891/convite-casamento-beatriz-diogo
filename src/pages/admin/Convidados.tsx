import GuestsManager from "@/components/admin/GuestsManager";

const Convidados = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Gerenciar Convidados</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie convidados e envie convites
        </p>
      </div>

      <GuestsManager />
    </div>
  );
};

export default Convidados;
