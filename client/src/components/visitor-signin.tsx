import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { signInVisitorSchema, type SignInVisitor } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import WebcamCapture from "@/components/webcam-capture";
import { generateBadgePDF } from "@/lib/pdf-generator";

export default function VisitorSignIn() {
  const [photoData, setPhotoData] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<SignInVisitor>({
    resolver: zodResolver(signInVisitorSchema),
    defaultValues: {
      name: "",
      company: "",
      hostName: "",
      visitReason: "",
      photoData: "",
    },
  });

  const signInMutation = useMutation({
    mutationFn: (data: SignInVisitor) => apiRequest("POST", "/api/visitors/signin", data),
    onSuccess: async (response) => {
      const visitor = await response.json();
      
      // Generate and download badge PDF
      if (photoData) {
        try {
          generateBadgePDF({
            name: visitor.name,
            company: visitor.company || "Guest",
            hostName: visitor.hostName,
            visitReason: visitor.visitReason,
            signInTime: new Date(visitor.signInTime),
            photoData,
          });
        } catch (pdfError) {
          console.error("Failed to generate badge PDF:", pdfError);
          toast({
            title: "Badge generation failed",
            description: "Visitor signed in successfully, but badge PDF generation failed.",
            variant: "destructive",
          });
        }
      }

      toast({
        title: "Welcome!",
        description: `${visitor.name} has been successfully signed in. Your host has been notified.`,
      });

      form.reset();
      setPhotoData(null);
      queryClient.invalidateQueries({ queryKey: ["/api/visitors/current"] });
    },
    onError: (error: any) => {
      toast({
        title: "Sign-in failed",
        description: error.message || "Failed to sign in. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SignInVisitor) => {
    const submitData = {
      ...data,
      photoData: photoData || undefined,
    };
    signInMutation.mutate(submitData);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg border border-gray-200">
        <CardContent className="p-8">
          <div className="flex items-center mb-6">
            <UserPlus className="text-primary text-2xl mr-3" />
            <h3 className="text-2xl font-semibold text-gray-900">Visitor Sign-in</h3>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Your Name *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter your full name"
                          className="form-input-large"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Company</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Company name"
                          className="form-input-large"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="hostName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Person You're Visiting *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter host's name"
                        className="form-input-large"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="visitReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Reason for Visit *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="form-input-large">
                          <SelectValue placeholder="Select reason..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="meeting">Business Meeting</SelectItem>
                        <SelectItem value="interview">Job Interview</SelectItem>
                        <SelectItem value="delivery">Delivery</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Photo Capture Section */}
              <div className="bg-gray-50 rounded-lg p-6">
                <WebcamCapture onPhotoCapture={setPhotoData} />
              </div>
              
              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  className="btn-secondary"
                  onClick={() => {
                    form.reset();
                    setPhotoData(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="btn-primary"
                  disabled={signInMutation.isPending}
                >
                  {signInMutation.isPending ? "Signing In..." : "Sign In"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
