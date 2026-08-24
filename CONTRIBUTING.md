# Contributing to Maskanwa Open Community

Thank you for contributing to **Maskanwa Open Community**. ❤️

Maskanwa is an open digital community for the Maskanwa region. The project brings local schools, colleges, shops, businesses, professionals, and services onto the web through a common platform.

The guiding principle is:

> **Content is Human, Structure is Machine.**

Contributors should focus primarily on **content and community**, while the platform takes care of generation, validation, deployment, and routing.

---

## 🧭 Project Structure

The repository is organised around a simple separation of responsibilities:

```
maskanwa-web/
│
├── engine/                 # Website generation and platform logic
│
├── public/                 # Community and institution content
│   ├── www/                # Maskanwa public showcase
│   ├── gvm/                # Example institution
│   └── ...
│
├── worker/                 # Edge routing
│
├── .github/
│   └── workflows/          # Automated validation and deployment
│
├── manifest.json           # Generated platform metadata
│
└── package.json
````

### `public/`

This is where community content lives.

Each institution or entity has its own directory:

```
public/<slug>/
```

For example:

```
public/gvm/
public/cbs/
public/gupta-kirana/
```

The directory slug becomes part of the entity's Maskanwa address.

```
public/gvm/
        ↓
gvm.maskanwa.com
```

---

## ✍️ Adding an Entity

A basic entity normally starts with:

```
public/
└── my-entity/
    └── site.md
```

The `site.md` file contains the entity's information using Markdown.

For example:

```
---
name: G.V.M. Inter College
type: College
---

# G.V.M. Inter College

Information about the institution goes here.

## About Us

Write about the institution here.

## Contact

Phone: +91 XXXXX XXXXX
```

Keep the content human-readable.

**Do not write HTML or CSS when ordinary Markdown can express the same thing.**

---

## 🏷️ Entity Slugs

Directory names are used as public identifiers.

Prefer:

```
gupta-kirana
gvm
city-public-school
```

Avoid:

```
Gupta Kirana Store!!!
My School 123
school_with_random_symbols
```

Use short, readable, stable slugs.

Once an entity has been published, avoid changing its slug unnecessarily because it may already have been shared with people.

---

## 📝 Markdown

Standard Markdown is preferred.

You can use:

* headings
* paragraphs
* bold and italic text
* lists
* links
* images
* blockquotes
* tables

Example:

```
## Facilities

- Computer Laboratory
- Library
- Playground
- Smart Classes
```

The engine determines how this content is presented.

**Content contributors should not need to know the implementation details of the renderer.**

---

## 🖼️ Images

Images may be referenced using normal Markdown:

```
![School Building](assets/school.jpg)
```

or, where appropriate:

```
![School Building](https://example.com/school.jpg)
```

Images should:

* have meaningful alternative text
* be relevant to the entity
* be reasonably sized
* not violate copyright or privacy

Do not use an image merely because it makes the page look busy.

---

## 🔗 Links

Use normal Markdown links:

```
[Visit our website](https://example.com)
```

For WhatsApp links, use the appropriate official URL format:

```
[Contact us on WhatsApp](https://wa.me/XXXXXXXXXX)
```

Do not embed JavaScript or custom tracking code.

---

## 🔐 Security

Maskanwa is an open community, but **open contribution does not mean unrestricted execution**.

Markdown content is treated as content, not executable code.

Do not attempt to insert:

```
<script>
```

custom JavaScript, embedded applications, or other executable content into entity pages.

The build system validates and sanitizes contributed content before publication.

If you believe the platform needs a new capability, propose it as a change to the engine rather than attempting to bypass the content rules.

---

## 🤖 Machine-Generated Files

Some files are generated automatically.

In particular:

```
manifest.json
```

is **not a manually maintained directory database**.

The build process discovers and validates entities and generates the required platform metadata.

### Do not manually edit generated files unless the project specifically asks you to do so.

If your contribution changes an entity, allow the workflow to regenerate the relevant metadata.

---

## ⚙️ The Engine

The `engine/` directory contains the shared website-generation logic.

Changes here can affect **every Maskanwa entity**.

Before changing the engine, consider:

* Will existing entities continue to build?
* Does the change affect Markdown rendering?
* Does it affect accessibility?
* Does it affect mobile layouts?
* Does it affect SEO?
* Does it introduce entity-specific assumptions?

The engine should remain generic.

### Do not add logic such as:

```
if (slug === "gvm") {
    // special GVM behaviour
}
```

If something is genuinely common to all entities, implement it in the engine.

If something belongs only to one entity, it belongs in that entity's content.

---

## 🌐 The Worker

The `worker/` directory contains the edge-routing layer.

The Worker identifies the incoming hostname and routes it appropriately.

For example:

```
gvm.maskanwa.com
        ↓
gvm
        ↓
GVM content
```

The root domains:

```
maskanwa.com
www.maskanwa.com
```

represent the **Maskanwa showcase/community**, not an institution.

The Worker should therefore distinguish between:

```
Platform
    maskanwa.com
    www.maskanwa.com

Entities
    *.maskanwa.com
```

### Do not hardcode individual entities into the Worker.

Adding:

```
public/new-school/
```

should not require adding another `if` statement to the Worker.

---

## 🧪 Before Opening a Pull Request

Please check your changes locally where practical.

At minimum:

1. Confirm Markdown is valid.
2. Check image paths.
3. Check external links.
4. Check frontmatter.
5. Make sure the entity slug is appropriate.
6. Make sure no private information was accidentally included.
7. Run the project's available validation/build commands.
8. Review the generated page before submitting.

---

## 🚦 GitHub Actions

Pull requests and changes are expected to pass the project's automated checks.

The workflow may validate:

* entity structure
* frontmatter
* Markdown
* links
* assets
* generated metadata
* website generation
* deployment artifacts

A failed build is not something to bypass.

**Fix the underlying contribution instead.**

---

## 💡 Proposing Engine Changes

If you want to add a platform capability, explain:

### What problem does it solve?

### Who benefits from it?

### Can it be achieved through content instead?

### Will it affect existing entities?

### Does it introduce additional maintenance?

Prefer small, reusable improvements over entity-specific features.

---

## 🧹 Keep Contributions Clean

Please avoid unrelated changes in the same pull request.

Good:

```
Add GVM institution
```

Good:

```
Improve Markdown image handling
```

Less useful:

```
Add GVM + redesign homepage + change Worker + rename directories
```

Small changes are easier to review, test, and revert.

---

## 🤝 Pull Requests

A useful pull request should briefly explain:

* **What changed**
* **Why it changed**
* **Which entities or platform components are affected**
* **How it was tested**

For example:

```
## What changed

Added G.V.M. Inter College to the Maskanwa community.

## Content

- Added institution profile
- Added contact information
- Added facilities
- Added photographs

## Testing

- Build passes
- Markdown validated
- Images verified
```

---

## ❤️ Community Contributions

Maskanwa is not intended to be built by one person forever.

If you know a school, college, shop, business, professional, or service that should be represented here, help them become part of the community.

A contribution does not have to be code.

**Content is a contribution too.**

You can help by:

* adding an institution
* correcting inaccurate information
* improving descriptions
* providing photographs
* fixing broken links
* improving the engine
* improving accessibility
* improving documentation
* suggesting useful features

---

## 🌱 The Principle

Please keep one idea in mind while contributing:

> **People should describe their work.
> Machines should deal with the machinery.**

Don't make local contributors learn technology unnecessarily.

Don't make the engine understand individual institutions.

Don't turn a simple contribution into a complicated process.

Build things that make the next contribution **easier than the last one**.

---

## 🚀 Welcome to Maskanwa

Whether you contribute one Markdown file or improve the engine itself, you're helping build an open digital presence for the Maskanwa community.

**Apan Maskanwa. Apan pehchaan. ❤️**

**Maskanwa Open Community**
