<div align="center">

# Email Templates Admin

### **Google Stitch** — Visual system: [`theme.md`](../../theme.md). **Surface:** Admin (operations console). Use this file’s wireframe for layout and copy; apply color, typography, motion, and components from `theme.md`.

</div>

---

This page allows administrators to preview, test, and configure transactional email templates (`admin/email-templates`).

---

## 📐 Layout

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  Email Templates Management                                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌─ TEMPLATES LIST ───────────────────────────────────────────────────────┐  │
│  │  Template Name          Subject Line                     Action        │  │
│  │  Welcome_Email          Welcome to Nestlancer!           [Edit]        │  │
│  │  Password_Reset         Reset your password              [Edit]        │  │
│  │  Invoice_Created        New Invoice #{{invoice.id}}      [Edit]        │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─ EDIT TEMPLATE: Welcome_Email ─────────────────────────────────────────┐  │
│  │  Subject: [Welcome to Nestlancer!                            ]         │  │
│  │                                                                        │  │
│  │  [HTML Editor Tab] | [Plain Text Tab] | [Preview Tab]                  │  │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  │ <h1>Hello {{user.firstName}},</h1>                               │  │
│  │  │ <p>Welcome to our platform!</p>                                  │  │
│  │  └──────────────────────────────────────────────────────────────────┘  │
│  │                                                                        │  │
│  │  [Save Changes]  [Send Test Email]                                     │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Interactive Elements

- `[Edit]`: Opens the template in the editor below.
- `[Save Changes]`: Triggers `PATCH /system/email-templates/:id` to save modifications.
- `[Send Test Email]`: Opens a modal to input an email address and triggers `POST /system/email-templates/:id/test`.
- `[Preview Tab]`: Renders the HTML template with dummy data (triggers `GET /system/email-templates/:id/preview`).

---

## Data Bindings

- Templates List: `GET /system/email-templates`
- Template Details: `GET /system/email-templates/:id`

---

<div align="center">

**Email Templates Admin** — UI wireframe specification

</div>
