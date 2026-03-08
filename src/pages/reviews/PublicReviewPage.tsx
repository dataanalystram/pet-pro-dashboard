import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Star, CheckCircle2, PawPrint } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { cn } from "@/lib/utils";

const reviewSchema = z.object({
  customer_name: z.string().trim().min(1, "Name is required").max(100),
  customer_email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
  review_text: z.string().trim().min(10, "Review must be at least 10 characters").max(2000),
  pet_name: z.string().trim().max(100).optional().or(z.literal("")),
  pet_species: z.string().trim().max(50).optional().or(z.literal("")),
});

export default function PublicReviewPage() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    review_text: "",
    pet_name: "",
    pet_species: "",
  });

  const { data: service, isLoading } = useQuery({
    queryKey: ["service", serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, category, cover_image_url")
        .eq("id", serviceId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!serviceId,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (rating === 0) {
      setErrors({ rating: "Please select a rating" });
      return;
    }

    const result = reviewSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      service_id: serviceId!,
      rating,
      customer_name: result.data.customer_name,
      customer_email: result.data.customer_email || null,
      review_text: result.data.review_text,
      pet_name: result.data.pet_name || null,
      pet_species: result.data.pet_species || null,
      status: "pending",
    });

    setSubmitting(false);
    if (error) {
      toast.error("Failed to submit review. Please try again.");
      return;
    }
    setSubmitted(true);
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <CheckCircle2 className="w-16 h-16 text-primary mx-auto" />
            <h2 className="text-2xl font-bold">Thank You!</h2>
            <p className="text-muted-foreground">
              Your review has been submitted and is pending approval. We appreciate your feedback!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8 space-y-2">
            <h2 className="text-xl font-bold">Service Not Found</h2>
            <p className="text-muted-foreground">This review link may be invalid or expired.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <PawPrint className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Review: {service.name}</CardTitle>
          <CardDescription>Share your experience to help us improve</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Star Rating */}
            <div className="space-y-2">
              <Label>Rating *</Label>
              <div className="flex gap-1 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => { setRating(star); setErrors((p) => ({ ...p, rating: "" })); }}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn(
                        "w-8 h-8 transition-colors",
                        (hoveredRating || rating) >= star
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30"
                      )}
                    />
                  </button>
                ))}
              </div>
              {errors.rating && <p className="text-sm text-destructive text-center">{errors.rating}</p>}
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name">Your Name *</Label>
              <Input id="name" value={form.customer_name} onChange={(e) => updateField("customer_name", e.target.value)} placeholder="Jane Doe" />
              {errors.customer_name && <p className="text-sm text-destructive">{errors.customer_name}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email (optional)</Label>
              <Input id="email" type="email" value={form.customer_email} onChange={(e) => updateField("customer_email", e.target.value)} placeholder="jane@example.com" />
              {errors.customer_email && <p className="text-sm text-destructive">{errors.customer_email}</p>}
            </div>

            {/* Review */}
            <div className="space-y-1.5">
              <Label htmlFor="review">Your Review *</Label>
              <Textarea id="review" value={form.review_text} onChange={(e) => updateField("review_text", e.target.value)} placeholder="Tell us about your experience..." rows={4} />
              {errors.review_text && <p className="text-sm text-destructive">{errors.review_text}</p>}
            </div>

            {/* Pet Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="petName">Pet Name</Label>
                <Input id="petName" value={form.pet_name} onChange={(e) => updateField("pet_name", e.target.value)} placeholder="Buddy" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="petSpecies">Species</Label>
                <Input id="petSpecies" value={form.pet_species} onChange={(e) => updateField("pet_species", e.target.value)} placeholder="Dog" />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Review"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
