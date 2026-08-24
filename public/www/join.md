---
title: Join
---

# How to Join Maskanwa

Adding your institution or shop to the network is completely free and requires no coding knowledge.

### Who Can Join?

* **Education:** Schools, Inter Colleges, Degree Colleges, Coaching Institutes
* **Local Commerce:** Grocery Stores, Electronics Shops, Sweet Houses, Clothing Stores
* **Services:** Clinics, Hospitals, Legal Services, Plumbers, Electricians

Fill out this form, click **Create Now**, and you will be taken to GitHub to confirm your free website submission.

<form action="/join" method="get">

<div class="form-field">
    <label for="entity-type">Entity Type</label>
    <select id="entity-type" name="type" required>
        <option value="">Select one</option>
        <option value="school">School</option>
        <option value="college">College</option>
        <option value="store">Store</option>
        <option value="hospital">Hospital</option>
        <option value="service">Service</option>
    </select>
</div>

<div class="form-field">
    <label for="name">Name</label>
    <input
        id="name"
        name="name"
        type="text"
        placeholder="e.g. Gupta Kirana Store"
        required
    >
</div>

<div class="form-field">
    <label for="description">Short Description</label>
    <textarea
        id="description"
        name="description"
        placeholder="Tell the people of Maskanwa what you offer..."
        required
    ></textarea>
</div>

<div class="form-field">
    <label for="email">Email Address <span>(Optional)</span></label>
    <input
        id="email"
        name="email"
        type="email"
        placeholder="contact@example.com"
    >
</div>

<div class="form-field">
    <label for="phone">Phone Number <span>(Optional)</span></label>
    <input
        id="phone"
        name="phone"
        type="tel"
        placeholder="e.g. +91 98765 43210"
    >
</div>

<div class="form-field">
    <label for="whatsapp">WhatsApp Number <span>(Optional)</span></label>
    <input
        id="whatsapp"
        name="whatsapp"
        type="tel"
        placeholder="Include country code, e.g. 919876543210"
    >
</div>

<div class="form-field">
    <label for="maps">Google Maps Link <span>(Optional)</span></label>
    <input
        id="maps"
        name="maps"
        type="url"
        placeholder="https://maps.google.com/..."
    >
</div>

<div class="form-actions">
    <button type="submit">Create Now</button>
</div>

</form>
