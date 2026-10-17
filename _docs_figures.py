"""Generate APTNexus documentation diagrams (does not touch 3RKU folder)."""
from pathlib import Path
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Circle
import numpy as np

OUT = Path(r"C:\Users\Jcele\Desktop\Official Documentations\APTNexus\figures")
OUT.mkdir(parents=True, exist_ok=True)

NAVY = "#0F2340"
BLUE = "#2C5282"
LIGHT = "#E6EEF6"
ACCENT = "#3D6B9A"
GREEN = "#2F6B4F"
ORANGE = "#B0793A"
GRAY = "#5A6570"


def save(fig, name):
    path = OUT / name
    fig.savefig(path, dpi=160, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    print("wrote", path.name)


def box(ax, x, y, w, h, text, fc=LIGHT, ec=NAVY, fontsize=9, bold=False):
    p = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.02,rounding_size=0.04", linewidth=1.4, edgecolor=ec, facecolor=fc)
    ax.add_patch(p)
    ax.text(x + w / 2, y + h / 2, text, ha="center", va="center", fontsize=fontsize, color=NAVY, fontweight="bold" if bold else "normal", wrap=True)


def arrow(ax, x1, y1, x2, y2):
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1), arrowprops=dict(arrowstyle="->", color=BLUE, lw=1.5))


def fig_system_context():
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6)
    ax.axis("off")
    ax.set_title("APTNexus programme participants", fontsize=12, color=NAVY, pad=12)
    box(ax, 0.4, 4.2, 2.4, 1.2, "Security\n(mobile)", fc="#D9E8F5", bold=True)
    box(ax, 3.8, 4.2, 2.4, 1.2, "Admin /\nSuper Admin\n(mobile + console)", fc="#D9E8F5", bold=True)
    box(ax, 7.2, 4.2, 2.4, 1.2, "Site visitors\n(gate registration)", fc="#F5E6D9")
    box(ax, 2.5, 1.8, 5, 1.5, "APTNexus-Admin\nExpress API + MongoDB (aptnexus)\nhttps://aptnexus.sbd-one.com", fc="#FFF8E8", bold=True)
    box(ax, 0.4, 0.3, 2.8, 1.0, "Android / iOS\nAPTNexus app", fc=LIGHT)
    box(ax, 6.8, 0.3, 2.8, 1.0, "Browser console\naptnexus-admin.sbd-one.com", fc=LIGHT)
    arrow(ax, 1.6, 4.2, 4.0, 3.3)
    arrow(ax, 5.0, 4.2, 5.0, 3.3)
    arrow(ax, 8.4, 4.2, 6.5, 3.3)
    arrow(ax, 1.8, 1.3, 3.5, 1.8)
    arrow(ax, 8.2, 1.3, 6.5, 1.8)
    save(fig, "fig_system_context.png")


def fig_layered_mobile():
    fig, ax = plt.subplots(figsize=(9, 6.5))
    ax.set_xlim(0, 9)
    ax.set_ylim(0, 7)
    ax.axis("off")
    layers = [
        (5.5, "Presentation — Screens, AppTabBar, PageHeader, Toast", "#D9E8F5"),
        (4.3, "Navigation — AuthedNavigation (tabs + stack by role)", "#E4EDF7"),
        (3.1, "Application state — UserContext, Settings, Inbox", "#EEF3F9"),
        (1.9, "Services — utils/api.js, GPS, OCR, printPdf, media", "#F5F0E8"),
        (0.7, "Native / Expo — Camera, Location, Secure storage, Print", "#E8F5EE"),
    ]
    for y, text, fc in layers:
        box(ax, 0.6, y, 7.8, 0.95, text, fc=fc, fontsize=10)
    ax.text(4.5, 6.5, "APTNexus mobile — layered architecture", ha="center", fontsize=12, color=NAVY, fontweight="bold")
    save(fig, "fig_layered_mobile.png")


def fig_layered_admin():
    fig, ax = plt.subplots(figsize=(9, 6.5))
    ax.set_xlim(0, 9)
    ax.set_ylim(0, 7)
    ax.axis("off")
    layers = [
        (5.5, "Presentation — React console pages (Overview, Duty, Patrols…)", "#D9E8F5"),
        (4.3, "Client state — polling overview / live / trails (~8s)", "#E4EDF7"),
        (3.1, "API layer — Express REST /api/* + JWT ACL", "#EEF3F9"),
        (1.9, "Domain services — clock, scan, visitors, sites, checkpoints", "#F5F0E8"),
        (0.7, "Persistence — MongoDB aptnexus + GridFS media", "#E8F5EE"),
    ]
    for y, text, fc in layers:
        box(ax, 0.6, y, 7.8, 0.95, text, fc=fc, fontsize=10)
    ax.text(4.5, 6.5, "APTNexus-Admin — layered architecture", ha="center", fontsize=12, color=NAVY, fontweight="bold")
    save(fig, "fig_layered_admin.png")


def fig_boot_flow():
    fig, ax = plt.subplots(figsize=(9, 4.5))
    ax.set_xlim(0, 9)
    ax.set_ylim(0, 4.5)
    ax.axis("off")
    steps = [("Splash", 0.3), ("Hydrate\ntoken", 2.2), ("api.me()", 4.1), ("Role\nrouting", 6.0), ("Main\ntabs", 7.8)]
    for i, (label, x) in enumerate(steps):
        box(ax, x, 1.6, 1.5, 1.2, label, fc="#D9E8F5" if i < 4 else "#E8F5EE", fontsize=9, bold=True)
        if i < len(steps) - 1:
            arrow(ax, x + 1.5, 2.2, steps[i + 1][1], 2.2)
    box(ax, 4.1, 0.3, 1.5, 0.9, "Login", fc="#F5E6D9", fontsize=9)
    arrow(ax, 4.85, 1.6, 4.85, 1.2)
    ax.text(4.5, 4.1, "Runtime decision after application boot", ha="center", fontsize=12, color=NAVY, fontweight="bold")
    save(fig, "fig_boot_flow.png")


def fig_nav_map():
    fig, ax = plt.subplots(figsize=(10, 6.2))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6.2)
    ax.axis("off")
    ax.text(5, 5.9, "Navigation map by role", ha="center", fontsize=12, color=NAVY, fontweight="bold")
    box(ax, 0.3, 4.5, 4.4, 1.1, "Security tabs\nHome · Patrol · Gate · Settings", fc="#D9E8F5", bold=True)
    box(ax, 5.3, 4.5, 4.4, 1.1, "Admin / Super Admin tabs\nHome · Teams · Visitors · Patrol", fc="#E8F5EE", bold=True)
    box(ax, 0.3, 2.6, 9.4, 1.5, "Shared stack screens\nProfile · Settings · Sites · Checkpoints · TeamCreate · TeamMember · SecurityCameraScan · Notifications", fc="#FFF8E8", fontsize=9)
    box(ax, 0.3, 0.6, 4.4, 1.5, "Security Home actions\nClock in/out · Scan QR\nSite select · GPS trail", fc=LIGHT, fontsize=9)
    box(ax, 5.3, 0.6, 4.4, 1.5, "Admin Home desk\nOverview KPIs · Sites\nCheckpoints · Team shortcuts", fc=LIGHT, fontsize=9)
    save(fig, "fig_nav_map.png")


def fig_deployment():
    fig, ax = plt.subplots(figsize=(10, 5.5))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 5.5)
    ax.axis("off")
    ax.text(5, 5.2, "Deployment topology", ha="center", fontsize=12, color=NAVY, fontweight="bold")
    box(ax, 0.4, 3.4, 2.8, 1.3, "Phones\nExpo / APK / IPA", fc="#D9E8F5", bold=True)
    box(ax, 3.6, 3.4, 2.8, 1.3, "Public API\naptnexus.sbd-one.com", fc="#FFF8E8", bold=True)
    box(ax, 6.8, 3.4, 2.8, 1.3, "Admin console\naptnexus-admin…", fc="#E8F5EE", bold=True)
    box(ax, 2.0, 1.2, 6.0, 1.5, "VM host — PM2 aptnexus-admin :5190\nMongoDB database aptnexus · GridFS media", fc=LIGHT, fontsize=9)
    arrow(ax, 1.8, 3.4, 4.2, 2.7)
    arrow(ax, 5.0, 3.4, 5.0, 2.7)
    arrow(ax, 8.2, 3.4, 5.8, 2.7)
    save(fig, "fig_deployment.png")


def fig_data_model():
    fig, ax = plt.subplots(figsize=(10, 6.5))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6.5)
    ax.axis("off")
    ax.text(5, 6.2, "Principal entities (MongoDB aptnexus)", ha="center", fontsize=12, color=NAVY, fontweight="bold")
    entities = [
        (0.3, 4.6, "User\nrole, session"),
        (2.7, 4.6, "Site\nareas A–D"),
        (5.1, 4.6, "Checkpoint\nreferral APT-"),
        (7.5, 4.6, "DutyLog\nclock in/out"),
        (0.3, 2.6, "PatrolScan\nsite + area"),
        (2.7, 2.6, "Visitor\nIC / plate"),
        (5.1, 2.6, "LocationPoint\ntrail GPS"),
        (7.5, 2.6, "Notification\ninbox"),
        (1.5, 0.7, "Schedule"),
        (4.0, 0.7, "AuditLog"),
        (6.5, 0.7, "Chat / Groups"),
    ]
    for x, y, t in entities:
        box(ax, x, y, 2.1, 1.2, t, fc="#D9E8F5", fontsize=8)
    save(fig, "fig_data_model.png")


def fig_clock_flow():
    fig, ax = plt.subplots(figsize=(10, 3.8))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 3.8)
    ax.axis("off")
    labels = ["Select site", "Get GPS", "POST /duty/clock", "Trail starts", "Visible on\nAdmin Overview"]
    xs = [0.3, 2.2, 4.1, 6.0, 7.9]
    for i, (x, lab) in enumerate(zip(xs, labels)):
        box(ax, x, 1.3, 1.7, 1.3, lab, fc="#D9E8F5", fontsize=8, bold=True)
        if i < len(xs) - 1:
            arrow(ax, x + 1.7, 1.95, xs[i + 1], 1.95)
    ax.text(5, 3.4, "Clock-in process (Security)", ha="center", fontsize=12, color=NAVY, fontweight="bold")
    save(fig, "fig_clock_flow.png")


def fig_patrol_flow():
    fig, ax = plt.subplots(figsize=(10, 3.8))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 3.8)
    ax.axis("off")
    labels = ["Scan QR", "Resolve\ncheckpoint", "POST /patrols", "Store area\n+ site", "Patrol log\n+ PDF"]
    xs = [0.3, 2.2, 4.1, 6.0, 7.9]
    for i, (x, lab) in enumerate(zip(xs, labels)):
        box(ax, x, 1.3, 1.7, 1.3, lab, fc="#E8F5EE", fontsize=8, bold=True)
        if i < len(xs) - 1:
            arrow(ax, x + 1.7, 1.95, xs[i + 1], 1.95)
    ax.text(5, 3.4, "Checkpoint scan process", ha="center", fontsize=12, color=NAVY, fontweight="bold")
    save(fig, "fig_patrol_flow.png")


def fig_visitor_flow():
    fig, ax = plt.subplots(figsize=(10, 3.8))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 3.8)
    ax.axis("off")
    labels = ["IC photo\n+ OCR", "Plate photo\n+ OCR", "Confirm\nfields", "POST\n/visitors", "Visitors log\n+ PDF"]
    xs = [0.3, 2.2, 4.1, 6.0, 7.9]
    for i, (x, lab) in enumerate(zip(xs, labels)):
        box(ax, x, 1.3, 1.7, 1.3, lab, fc="#F5E6D9", fontsize=8, bold=True)
        if i < len(xs) - 1:
            arrow(ax, x + 1.7, 1.95, xs[i + 1], 1.95)
    ax.text(5, 3.4, "Gate visitor registration process", ha="center", fontsize=12, color=NAVY, fontweight="bold")
    save(fig, "fig_visitor_flow.png")


def fig_admin_sitemap():
    fig, ax = plt.subplots(figsize=(10, 5.5))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 5.5)
    ax.axis("off")
    ax.text(5, 5.2, "Admin console sitemap", ha="center", fontsize=12, color=NAVY, fontweight="bold")
    pages = [
        "Overview", "Duty log", "Patrols", "Scans", "Visitors",
        "Inbox", "Checkpoints", "Sites", "Trails", "Users",
    ]
    for i, p in enumerate(pages):
        r, c = divmod(i, 5)
        box(ax, 0.4 + c * 1.9, 3.2 - r * 1.5, 1.7, 1.0, p, fc="#D9E8F5", fontsize=8, bold=True)
    save(fig, "fig_admin_sitemap.png")


def fig_auth_flow():
    fig, ax = plt.subplots(figsize=(9, 5))
    ax.set_xlim(0, 9)
    ax.set_ylim(0, 5)
    ax.axis("off")
    box(ax, 3.5, 3.8, 2, 0.8, "Login", fc="#D9E8F5", bold=True)
    box(ax, 0.5, 2.2, 2.4, 1.0, "SESSION_ACTIVE?\nReplace session", fc="#F5E6D9", fontsize=8)
    box(ax, 3.3, 2.2, 2.4, 1.0, "JWT + sessionId\nstored", fc="#E8F5EE", fontsize=8)
    box(ax, 6.1, 2.2, 2.4, 1.0, "Route by role\nSecurity / Admin", fc="#D9E8F5", fontsize=8)
    box(ax, 3.3, 0.5, 2.4, 1.0, "Foreground refresh\nevery 45s", fc=LIGHT, fontsize=8)
    arrow(ax, 4.5, 3.8, 1.7, 3.2)
    arrow(ax, 4.5, 3.8, 4.5, 3.2)
    arrow(ax, 4.5, 3.8, 7.3, 3.2)
    arrow(ax, 4.5, 2.2, 4.5, 1.5)
    ax.text(4.5, 4.8, "Sign-in and session handling", ha="center", fontsize=12, color=NAVY, fontweight="bold")
    save(fig, "fig_auth_flow.png")


def fig_roles_req():
    fig, ax = plt.subplots(figsize=(9, 4.5))
    roles = ["Security", "Admin", "Super Admin"]
    caps = {
        "Clock / Scan / Gate": [1, 0.2, 0.2],
        "View Sites / CP": [0.2, 1, 1],
        "Manage Sites / CP": [0.1, 0.15, 1],
        "Manage Users": [0.1, 0.15, 1],
        "Console dashboard": [0, 1, 1],
    }
    data = np.array(list(caps.values()))
    im = ax.imshow(data, cmap="Blues", aspect="auto", vmin=0, vmax=1)
    ax.set_xticks(range(3))
    ax.set_xticklabels(roles)
    ax.set_yticks(range(len(caps)))
    ax.set_yticklabels(list(caps.keys()))
    ax.set_title("Capability matrix by role", color=NAVY)
    for i in range(data.shape[0]):
        for j in range(data.shape[1]):
            ax.text(j, i, "Yes" if data[i, j] > 0.5 else "No", ha="center", va="center", color="white" if data[i, j] > 0.5 else NAVY, fontsize=9)
    save(fig, "fig_roles_matrix.png")


def fig_kpi_example():
    fig, ax = plt.subplots(figsize=(8, 4))
    hours = list(range(8, 20))
    scans = [1, 2, 4, 6, 5, 7, 8, 6, 5, 4, 3, 2]
    visitors = [0, 1, 2, 3, 4, 5, 3, 4, 2, 2, 1, 1]
    ax.bar([h - 0.2 for h in hours], scans, width=0.4, label="Checkpoint scans", color=BLUE)
    ax.bar([h + 0.2 for h in hours], visitors, width=0.4, label="Visitors", color=ORANGE)
    ax.set_xlabel("Hour of day")
    ax.set_ylabel("Count (illustrative)")
    ax.set_title("Illustrative daily activity on Overview", color=NAVY)
    ax.legend()
    ax.set_facecolor("white")
    save(fig, "fig_kpi_activity.png")


def fig_user_journey():
    fig, ax = plt.subplots(figsize=(10, 4))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 4)
    ax.axis("off")
    ax.text(5, 3.7, "End-to-end user journey across roles", ha="center", fontsize=12, color=NAVY, fontweight="bold")
    box(ax, 0.3, 1.5, 2.0, 1.4, "Super Admin\nSites &\nCheckpoints", fc="#D9E8F5", fontsize=8, bold=True)
    box(ax, 2.7, 1.5, 2.0, 1.4, "Security\nClock in &\nScan", fc="#E8F5EE", fontsize=8, bold=True)
    box(ax, 5.1, 1.5, 2.0, 1.4, "Security\nRegister\nvisitor", fc="#F5E6D9", fontsize=8, bold=True)
    box(ax, 7.5, 1.5, 2.2, 1.4, "Admin\nReview logs\n& PDF", fc="#FFF8E8", fontsize=8, bold=True)
    for x in [2.3, 4.7, 7.1]:
        arrow(ax, x, 2.2, x + 0.4, 2.2)
    save(fig, "fig_user_journey.png")


def fig_req_context():
    fig, ax = plt.subplots(figsize=(9, 5))
    ax.set_xlim(0, 9)
    ax.set_ylim(0, 5)
    ax.axis("off")
    box(ax, 3, 3.5, 3, 1, "APTNexus\nplatform", fc="#FFF8E8", bold=True)
    box(ax, 0.4, 1.5, 2.4, 1.2, "Field security", fc="#D9E8F5")
    box(ax, 3.3, 1.5, 2.4, 1.2, "Command desk", fc="#E8F5EE")
    box(ax, 6.2, 1.5, 2.4, 1.2, "Audit & PDF", fc="#F5E6D9")
    arrow(ax, 1.6, 2.7, 3.5, 3.5)
    arrow(ax, 4.5, 2.7, 4.5, 3.5)
    arrow(ax, 7.4, 2.7, 5.5, 3.5)
    ax.text(4.5, 4.8, "Required system context", ha="center", fontsize=12, color=NAVY, fontweight="bold")
    save(fig, "fig_req_context.png")


def main():
    fig_system_context()
    fig_layered_mobile()
    fig_layered_admin()
    fig_boot_flow()
    fig_nav_map()
    fig_deployment()
    fig_data_model()
    fig_clock_flow()
    fig_patrol_flow()
    fig_visitor_flow()
    fig_admin_sitemap()
    fig_auth_flow()
    fig_roles_req()
    fig_kpi_example()
    fig_user_journey()
    fig_req_context()
    print("ALL FIGURES DONE")


if __name__ == "__main__":
    main()
