import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { signInVisitorSchema, signOutVisitorSchema, adminLoginSchema } from "@shared/schema";
import nodemailer from "nodemailer";

// Email configuration
const createEmailTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_USER || "your-email@gmail.com",
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASS || "your-app-password",
    },
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || "visitor-management-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }));

  // Visitor sign-in
  app.post("/api/visitors/signin", async (req, res) => {
    try {
      const validatedData = signInVisitorSchema.parse(req.body);
      const visitor = await storage.createVisitor(validatedData);
      
      // Send email notification to host
      try {
        const transporter = createEmailTransporter();
        await transporter.sendMail({
          from: process.env.SMTP_USER || process.env.EMAIL_USER || "visitor-system@company.com",
          to: `${validatedData.hostName.toLowerCase().replace(/\s+/g, '.')}@company.com`,
          subject: `Visitor Arrival: ${validatedData.name}`,
          html: `
            <h2>Visitor Arrival Notification</h2>
            <p><strong>Visitor:</strong> ${validatedData.name}</p>
            <p><strong>Company:</strong> ${validatedData.company || 'Not specified'}</p>
            <p><strong>Reason:</strong> ${validatedData.visitReason}</p>
            <p><strong>Arrival Time:</strong> ${visitor.signInTime.toLocaleString()}</p>
            <p>Please meet your visitor at the reception area.</p>
          `,
        });
        
        await storage.updateVisitor(visitor.id, { emailSent: true });
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
        // Don't fail the entire request if email fails
      }
      
      res.json(visitor);
    } catch (error) {
      res.status(400).json({ message: "Invalid visitor data", error: (error as Error).message });
    }
  });

  // Visitor sign-out
  app.post("/api/visitors/signout", async (req, res) => {
    try {
      const { name } = signOutVisitorSchema.parse(req.body);
      const visitor = await storage.signOutVisitorByName(name, new Date());
      
      if (!visitor) {
        return res.status(404).json({ message: "Visitor not found or already signed out" });
      }
      
      res.json(visitor);
    } catch (error) {
      res.status(400).json({ message: "Invalid sign-out data", error: (error as Error).message });
    }
  });

  // Admin sign-out visitor
  app.post("/api/admin/visitors/:id/signout", async (req, res) => {
    if (!req.session.adminUser) {
      return res.status(401).json({ message: "Admin authentication required" });
    }
    
    try {
      const { id } = req.params;
      const visitor = await storage.signOutVisitor(id, new Date());
      
      if (!visitor) {
        return res.status(404).json({ message: "Visitor not found" });
      }
      
      res.json(visitor);
    } catch (error) {
      res.status(500).json({ message: "Failed to sign out visitor", error: (error as Error).message });
    }
  });

  // Get current visitors
  app.get("/api/visitors/current", async (req, res) => {
    try {
      const visitors = await storage.getCurrentVisitors();
      res.json(visitors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch visitors", error: (error as Error).message });
    }
  });

  // Get all visitors (admin only) - without photos to reduce payload size
  app.get("/api/admin/visitors", async (req, res) => {
    if (!req.session.adminUser) {
      return res.status(401).json({ message: "Admin authentication required" });
    }
    
    try {
      const visitors = await storage.getAllVisitorsWithoutPhotos();
      res.json(visitors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch visitors", error: (error as Error).message });
    }
  });

  // Get single visitor with photo (admin only)
  app.get("/api/admin/visitors/:id", async (req, res) => {
    if (!req.session.adminUser) {
      return res.status(401).json({ message: "Admin authentication required" });
    }
    
    try {
      const { id } = req.params;
      const visitor = await storage.getVisitor(id);
      
      if (!visitor) {
        return res.status(404).json({ message: "Visitor not found" });
      }
      
      res.json(visitor);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch visitor", error: (error as Error).message });
    }
  });

  // Get stats (admin only)
  app.get("/api/admin/stats", async (req, res) => {
    if (!req.session.adminUser) {
      return res.status(401).json({ message: "Admin authentication required" });
    }
    
    try {
      const stats = await storage.getTodayStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats", error: (error as Error).message });
    }
  });

  // Admin login
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = adminLoginSchema.parse(req.body);
      const user = await storage.verifyAdminCredentials(username, password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      req.session.adminUser = { id: user.id, username: user.username };
      res.json({ success: true, user: { id: user.id, username: user.username } });
    } catch (error) {
      res.status(400).json({ message: "Invalid login data", error: (error as Error).message });
    }
  });

  // Admin logout
  app.post("/api/admin/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });

  // Check admin session
  app.get("/api/admin/session", (req, res) => {
    if (req.session.adminUser) {
      res.json({ authenticated: true, user: req.session.adminUser });
    } else {
      res.json({ authenticated: false });
    }
  });

  // Export data (admin only) - excludes photos to reduce file size
  app.get("/api/admin/export", async (req, res) => {
    if (!req.session.adminUser) {
      return res.status(401).json({ message: "Admin authentication required" });
    }
    
    try {
      const visitors = await storage.getAllVisitorsWithoutPhotos();
      const auditLogs = await storage.getAuditLogs();
      
      const exportData = {
        visitors,
        auditLogs,
        exportedAt: new Date().toISOString(),
        exportedBy: req.session.adminUser.username,
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=visitor-data-${new Date().toISOString().split('T')[0]}.json`);
      res.json(exportData);
    } catch (error) {
      res.status(500).json({ message: "Failed to export data", error: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Extend session type
declare module "express-session" {
  interface SessionData {
    adminUser?: {
      id: string;
      username: string;
    };
  }
}
