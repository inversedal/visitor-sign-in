import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { signOutVisitorSchema, type SignOutVisitor } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function VisitorSignOut() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<SignOutVisitor>({
    resolver: zodResolver(signOutVisitorSchema),
    defaultValues: {
      name: "",
    },
  });

  const signOutMutation = useMutation({
    mutationFn: (data: SignOutVisitor) => apiRequest("POST", "/api/visitors/signout", data),
    onSuccess: async (response) => {
      const visitor = await response.json();
      toast({
        title: "Goodbye!",
        description: `${visitor.name} has been successfully signed out. Thank you for visiting!`,
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/visitors/current"] });
    },
    onError: (error: any) => {
      toast({
        title: "Sign-out failed",
        description: error.message || "Visitor not found or already signed out.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SignOutVisitor) => {
    signOutMutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg border border-gray-200">
        <CardContent className="p-8">
          <div className="flex items-center mb-6">
            <LogOut className="text-warning text-2xl mr-3" />
            <h3 className="text-2xl font-semibold text-gray-900">Visitor Sign-out</h3>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Your Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter your name to sign out"
                        className="form-input-large"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="btn-warning"
                  disabled={signOutMutation.isPending}
                >
                  {signOutMutation.isPending ? "Signing Out..." : "Sign Out"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
