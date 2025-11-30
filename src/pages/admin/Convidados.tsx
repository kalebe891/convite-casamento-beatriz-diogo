import GuestsManager from "@/components/admin/GuestsManager";
import { usePagePermissions } from "@/hooks/usePagePermissions";

const Convidados = () => {
  const permissions = usePagePermissions("convidados");

  if (permissions.loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Gerenciar Convidados</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie convidados e envie convites
        </p>
      </div>

      <GuestsManager permissions={permissions} />
    </div>
  );
};

export default Convidados;
