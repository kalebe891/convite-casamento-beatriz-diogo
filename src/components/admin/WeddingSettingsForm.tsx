import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const WeddingSettingsForm = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    venue_map_url: "",
    couple_message: "",
  });

  useEffect(() => {
    fetchWeddingDetails();
  }, []);

  const fetchWeddingDetails = async () => {
    const { data, error } = await supabase
      .from("wedding_details")
      .select("*")
      .single();

    if (data) {
      setWeddingId(data.id);
      setFormData({
        venue_map_url: data.venue_map_url || "",
        couple_message: data.couple_message || "",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("wedding_details")
        .update(formData)
        .eq("id", weddingId);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Configurações atualizadas.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações da Página Pública</CardTitle>
        <CardDescription>
          Configure como os convidados verão seu convite online
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="venue_map_url">URL do Mapa (Google Maps Embed)</Label>
            <Input
              id="venue_map_url"
              placeholder="https://www.google.com/maps/embed?pb=..."
              value={formData.venue_map_url}
              onChange={(e) => setFormData({ ...formData, venue_map_url: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">
              Cole o link de incorporação do Google Maps
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="couple_message">Mensagem do Casal</Label>
            <Textarea
              id="couple_message"
              placeholder="Escreva uma mensagem especial para seus convidados..."
              value={formData.couple_message}
              onChange={(e) => setFormData({ ...formData, couple_message: e.target.value })}
              rows={4}
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default WeddingSettingsForm;
