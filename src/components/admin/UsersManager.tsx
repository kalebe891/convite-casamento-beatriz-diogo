import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail } from "lucide-react";
import UsersList from "./UsersList";

const UsersManager = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "couple" | "planner">("admin");
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [magicLink, setMagicLink] = useState<string | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !role) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o email e selecione um papel.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setMagicLink(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("Você precisa estar autenticado");
      }

      const { data, error } = await supabase.functions.invoke("invite-admin", {
        body: { email, role, nome: email.split('@')[0] },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Convite criado",
        description: data?.email_sent 
          ? `Convite enviado por e-mail para ${email}` 
          : `Convite criado para ${email}. Copie o link abaixo.`,
      });

      if (data?.invitation_link) {
        setMagicLink(data.invitation_link);
      }

      setEmail("");
      setRole("admin");
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Error inviting user:", error);
      toast({
        title: "Erro ao criar convite",
        description: error.message || "Não foi possível criar o convite.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Convidar Novo Usuário</CardTitle>
          <CardDescription>
            Convide administradores, membros do casal ou cerimonialistas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail do Usuário</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Tipo de Acesso</Label>
              <Select value={role} onValueChange={(value: any) => setRole(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de acesso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="couple">Casal</SelectItem>
                  <SelectItem value="planner">Cerimonialista</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={loading} className="w-full gap-2">
              <Mail className="w-4 h-4" />
              {loading ? "Enviando..." : "Enviar Convite"}
            </Button>
          </form>

          {magicLink && (
            <div className="mt-6 p-4 bg-accent/10 border border-accent rounded-lg">
              <p className="text-sm font-semibold mb-3 text-accent-foreground">🔑 Link de Acesso Gerado</p>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={magicLink}
                  readOnly
                  className="flex-1 font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(magicLink);
                    toast({
                      title: "Link copiado!",
                      description: "O link foi copiado para a área de transferência",
                    });
                  }}
                >
                  Copiar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                ⚠️ Envie este link manualmente para o usuário acessar e criar sua senha
              </p>
            </div>
          )}

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Como funciona:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Digite o e-mail do usuário que deseja convidar</li>
              <li>Selecione o tipo de acesso apropriado</li>
              <li>Um email será enviado com link para criar senha (válido por 48h)</li>
              <li>O usuário cria uma senha e é redirecionado para login</li>
              <li>Se o email não for entregue, copie o link e envie manualmente</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <UsersList key={refreshKey} />
    </div>
  );
};

export default UsersManager;
