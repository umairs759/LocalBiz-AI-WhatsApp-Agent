import { AnnaAppRuntime } from "/static/anna-apps/_sdk/latest/index.js";

const TOOL_ID = "tool-dev-localbiz-official";

class LocalBizEngine {
  constructor() {
    this.anna = null;
    this.isAudioEnabled = true;
    this.audioCtx = null;
    this.totalGmv = 0;

    // DOM Elements Mapping
    this.dom = {
      chatHistory: document.getElementById("chatHistory") || document.getElementById("chat-history"),
      userInput: document.getElementById("userInput") || document.getElementById("user-input"),
      sendBtn: document.getElementById("sendBtn") || document.getElementById("send-btn"),
      engineStatus: document.getElementById("engineStatus") || document.getElementById("engine-status"),
      intentTag: document.getElementById("intentTag") || document.getElementById("intent-tag"),
      leadPhone: document.getElementById("leadPhone") || document.getElementById("lead-contact"),
      leadDelivery: document.getElementById("leadDelivery") || document.getElementById("lead-delivery"),
      orderValue: document.getElementById("orderValue"),
      configBizName: document.getElementById("configBizName"),
      configBizProfile: document.getElementById("configBizProfile"),
      configMenu: document.getElementById("configMenu"),
      headerBizTitle: document.getElementById("headerBizTitle"),
      audioToggle: document.getElementById("audioToggle")
    };

    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.connectAnna();
    await this.loadPersistedConfig();
  }

  // --- Web Audio Synthesizer (Mechanical Haptics) ---
  ensureAudio() {
    if (!this.audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.audioCtx = new AC();
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  }

  playHaptic(type = "click") {
    if (!this.isAudioEnabled) return;
    try {
      this.ensureAudio();
      if (!this.audioCtx) return;

      const t0 = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      if (type === "click") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(640, t0);
        osc.frequency.exponentialRampToValueAtTime(140, t0 + 0.035);
        gain.gain.setValueAtTime(0.12, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.035);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.04);
      } else if (type === "pop") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(320, t0);
        osc.frequency.exponentialRampToValueAtTime(540, t0 + 0.05);
        gain.gain.setValueAtTime(0.14, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.06);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.065);
      }
    } catch (_) {}
  }

  // --- Anna OS Bridge Connection ---
  async connectAnna() {
    try {
      this.anna = await AnnaAppRuntime.connect();
      await this.anna.window.set_title({ title: "LocalBiz AI — Receptionist & Order Engine" });
      
      // >>> Anna OS ko app-ready signal send karne ke liye: <<<
      if (this.anna.window && this.anna.window.ready) {
        await this.anna.window.ready();
      }

      if (this.dom.engineStatus) {
        this.dom.engineStatus.textContent = "Anna OS Bridge: Active";
      }
    } catch (err) {
      console.warn("[LocalBiz] Operating in Standalone Simulator mode:", err);
      if (this.dom.engineStatus) {
        this.dom.engineStatus.textContent = "Standalone Test Mode";
      }
    }
  }

  // --- Bidirectional KV Storage Sync ---
  async loadPersistedConfig() {
    if (!this.anna) return;
    try {
      const saved = await this.anna.storage.get({ key: "localbiz:biz_config" });
      if (saved && saved.value) {
        const cfg = saved.value;
        if (cfg.name && this.dom.configBizName) this.dom.configBizName.value = cfg.name;
        if (cfg.profile && this.dom.configBizProfile) this.dom.configBizProfile.value = cfg.profile;
        if (cfg.menu && this.dom.configMenu) this.dom.configMenu.value = cfg.menu;
        this.updateHeaderTitle();
      }
    } catch (e) {
      console.warn("[LocalBiz] Storage read skipped:", e);
    }
  }

  async persistConfig() {
    this.updateHeaderTitle();
    this.playHaptic("click");
    if (!this.anna) return;
    try {
      await this.anna.storage.set({
        key: "localbiz:biz_config",
        value: {
          name: this.getBizName(),
          profile: this.getBizProfile(),
          menu: this.getMenuItems()
        }
      });
    } catch (_) {}
  }

  updateHeaderTitle() {
    if (this.dom.headerBizTitle && this.dom.configBizName) {
      this.dom.headerBizTitle.innerHTML = `${this.escape(this.dom.configBizName.value)} <span class="badge-anna">Anna App</span>`;
    }
  }

  // Helper getters to prevent hardcoding
  getBizName() {
    return this.dom.configBizName ? this.dom.configBizName.value.trim() : "Labaik Broast Operations";
  }

  getBizProfile() {
    return this.dom.configBizProfile ? this.dom.configBizProfile.value.trim() : "Daily 4:00 PM - 2:00 AM | Main Boulevard | Free Delivery above Rs. 1000";
  }

  getMenuItems() {
    return this.dom.configMenu ? this.dom.configMenu.value.trim() : "Quarter Broast: Rs. 480 | Half Broast: Rs. 890 | Full Broast: Rs. 1650 | Zinger Burger: Rs. 420 | Family Deal: Rs. 1950";
  }

  escape(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // --- UI Message Append with KOT Ticket Generator ---
  appendMessage(text, role = "ai", ticketData = null) {
    if (!this.dom.chatHistory) return;

    const msg = document.createElement("article");
    msg.className = `msg msg--${role}`;

    let ticketHtml = "";
    if (ticketData && ticketData.items_identified && ticketData.items_identified.length > 0) {
      const rows = ticketData.items_identified.map(it => `
        <div class="kot-item-row" style="display:flex;justify-content:space-between;padding:2px 0;">
          <span>${this.escape(it.item)}</span>
          <span>Rs. ${it.price}</span>
        </div>
      `).join("");

      ticketHtml = `
        <div class="kot-ticket" style="margin-top:10px;padding:10px 12px;border-radius:6px;background:rgba(245,158,11,0.08);border:1px dashed rgba(245,158,11,0.35);">
          <div style="font-family:monospace;font-size:10.5px;font-weight:700;color:#f59e0b;display:flex;justify-content:space-between;border-bottom:1px dashed rgba(245,158,11,0.25);padding-bottom:5px;margin-bottom:6px;">
            <span>KOT #LB-${Math.floor(1000 + Math.random() * 9000)}</span>
            <span>KITCHEN DISPATCH</span>
          </div>
          ${rows}
          <div style="display:flex;justify-content:space-between;font-weight:700;margin-top:6px;padding-top:6px;border-top:1px solid rgba(245,158,11,0.3);color:#fff;">
            <span>Total Estimated</span>
            <span>Rs. ${ticketData.estimated_total_pkr}</span>
          </div>
        </div>
      `;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    msg.innerHTML = `
      ${this.escape(text)}
      ${ticketHtml}
      <div class="msg__meta" style="font-size:10px;font-family:monospace;color:#64748b;margin-top:6px;display:flex;justify-content:flex-end;align-items:center;gap:4px;">
        <span>${role === "ai" ? "LocalBiz AI" : "Customer"}</span>
        <span>·</span>
        <span>${timeStr}</span>
        ${role === "user" ? `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L7 17l-5-5"></path><path d="M22 10l-7.5 7.5L13 16"></path></svg>
        ` : `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
        `}
      </div>
    `;

    this.dom.chatHistory.appendChild(msg);
    this.dom.chatHistory.scrollTop = this.dom.chatHistory.scrollHeight;
  }

  // --- Standalone Fallback NLP (Ensures Zero Breakage in Previews) ---
  clientFallbackEngine(query) {
    const q = query.toLowerCase();
    const phoneRegex = /(?:(?:\+92|0092|0)?\s?3[0-9]{2}[-\s]?[0-9]{7})/;
    const phoneMatch = query.match(phoneRegex);
    const phone = phoneMatch ? phoneMatch[0].replace(/\s+/g, "") : null;

    let intent = "INQUIRE_INFO";
    let isDelivery = /(deliver|delivery|bhejo|rider|address|ghar|parcel)/i.test(q);
    let orderDetected = /(order|chahiye|mangwana|pack|parcel|broast|zinger|burger|roll|deal)/i.test(q);
    let isEscalation = /(manager|complaint|insan|agent|owner|call|admin)/i.test(q);

    const catalog = [
      { key: "quarter broast", name: "Quarter Broast", price: 480 },
      { key: "half broast", name: "Half Broast", price: 890 },
      { key: "full broast", name: "Full Broast", price: 1650 },
      { key: "broast", name: "Quarter Broast", price: 480 },
      { key: "zinger", name: "Zinger Burger", price: 420 },
      { key: "roll", name: "Chicken Roll", price: 280 },
      { key: "family deal", name: "Family Deal", price: 1950 }
    ];

    const identified = [];
    let total = 0;

    catalog.forEach(item => {
      if (q.includes(item.key)) {
        if (item.key === "broast" && (q.includes("quarter") || q.includes("half") || q.includes("full"))) return;
        identified.push({ item: item.name, price: item.price });
        total += item.price;
      }
    });

    let reply = "";
    if (isEscalation) {
      intent = "ESCALATION";
      reply = `Aapka message human front-desk team ko forward kar diya gaya hai. Hamara manager jald call karega.`;
    } else if (orderDetected && identified.length > 0) {
      intent = "PLACE_ORDER";
      reply = `Order receive ho gaya! Delivery ke liye address share kar dein. Total estimated amount Rs. ${total} hy.`;
    } else if (/(menu|rate|price|qeemat|deals)/i.test(q)) {
      intent = "INQUIRE_MENU";
      reply = `Hamara fresh menu: Quarter Broast (Rs. 480), Zinger Burger (Rs. 420), Family Deal (Rs. 1950). Free delivery above Rs. 1000!`;
    } else if (/(timing|time|kahan|location|address|open)/i.test(q)) {
      intent = "INQUIRE_INFO";
      reply = `${this.getBizName()} rozana 4:00 PM se 2:00 AM tak open rehta hai. Delivery & takeaway dono available hain.`;
    } else if (/(salam|hello|hi|hey|aoa)/i.test(q)) {
      intent = "GREETING";
      reply = `Walaikum Assalam! Main ${this.getBizName()} ka AI Receptionist hoon. Aaj aapke liye kya prepare kiya jaye?`;
    } else {
      intent = "INQUIRE_INFO";
      reply = `Welcome! Aap hamara menu dekh sakte hain ya direct delivery order place kar sakte hain.`;
    }

    return {
      reply,
      intent,
      lead: {
        phone: phone,
        is_delivery: isDelivery,
        estimated_total_pkr: total,
        items_identified: identified
      }
    };
  }

  // --- Main Dispatch Pipeline ---
  async handleDispatch(forcedText = null) {
    const query = forcedText || (this.dom.userInput ? this.dom.userInput.value.trim() : "");
    if (!query) return;

    this.playHaptic("click");
    this.appendMessage(query, "user");
    if (this.dom.userInput) this.dom.userInput.value = "";
    if (this.dom.engineStatus) this.dom.engineStatus.textContent = "Processing via LLM...";

    const payloadArgs = {
      business_name: this.getBizName(),
      business_profile: this.getBizProfile(),
      menu_items: this.getMenuItems(),
      customer_message: query
    };

    try {
      let responseData = null;

      if (this.anna) {
        // Official Anna Tool Execution Contract
        const res = await this.anna.tools.invoke({
          tool_id: TOOL_ID,
          method: "handle_inquiry",
          args: payloadArgs
        });
        responseData = res?.data || res;
        await this.anna.storage.set({ key: "localbiz:latest_run", value: Date.now() });
      } else {
        responseData = this.clientFallbackEngine(query);
      }

      setTimeout(() => {
        this.playHaptic("pop");
        this.appendMessage(responseData.reply, "ai", responseData.lead);

        // Update Live Telemetry
        if (responseData.intent && this.dom.intentTag) {
          this.dom.intentTag.textContent = responseData.intent;
          this.dom.intentTag.className = `tag-state ${responseData.intent === "PLACE_ORDER" ? "tag--order" : responseData.intent === "ESCALATION" ? "tag--escalation" : ""}`;
        }
        if (responseData.lead) {
          if (this.dom.leadPhone) this.dom.leadPhone.textContent = responseData.lead.phone || "None";
          if (this.dom.leadDelivery) this.dom.leadDelivery.textContent = responseData.lead.is_delivery ? "Yes" : "No";
          if (this.dom.orderValue) this.dom.orderValue.textContent = `Rs. ${responseData.lead.estimated_total_pkr || 0}`;
        }
      }, 120);

    } catch (err) {
      console.error("[LocalBiz] Execution error:", err);
      this.appendMessage(`Notice: ${err.message || "Failed to process inquiry via tool."}`, "ai");
    } finally {
      if (this.dom.engineStatus) {
        this.dom.engineStatus.textContent = this.anna ? "Anna OS Bridge: Active" : "Standalone Test Mode";
      }
    }
  }

  setupEventListeners() {
    if (this.dom.sendBtn) {
      this.dom.sendBtn.addEventListener("click", () => this.handleDispatch());
    }
    if (this.dom.userInput) {
      this.dom.userInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") this.handleDispatch();
      });
    }

    document.querySelectorAll(".chip").forEach(chip => {
      chip.addEventListener("click", () => {
        const query = chip.getAttribute("data-query");
        this.handleDispatch(query);
      });
    });

    [this.dom.configBizName, this.dom.configBizProfile, this.dom.configMenu].forEach(input => {
      if (input) input.addEventListener("change", () => this.persistConfig());
    });

    if (this.dom.audioToggle) {
      this.dom.audioToggle.addEventListener("click", () => {
        this.isAudioEnabled = !this.isAudioEnabled;
        this.dom.audioToggle.classList.toggle("active", this.isAudioEnabled);
      });
    }

    const clearBtn = document.getElementById("clearBtn") || document.getElementById("clear-btn");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        this.playHaptic("click");
        if (this.dom.chatHistory) {
          this.dom.chatHistory.innerHTML = `
            <article class="msg msg--ai">
              Log cleared. Receptionist ready for new session.
              <div class="msg__meta">LocalBiz AI · Ready</div>
            </article>
          `;
        }
        if (this.dom.intentTag) this.dom.intentTag.textContent = "STANDBY";
        if (this.dom.leadPhone) this.dom.leadPhone.textContent = "None";
        if (this.dom.leadDelivery) this.dom.leadDelivery.textContent = "No";
        if (this.dom.orderValue) this.dom.orderValue.textContent = "Rs. 0";
      });
    }

    const exportBtn = document.getElementById("exportBtn") || document.getElementById("export-btn");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        this.playHaptic("click");
        const record = {
          business: this.getBizName(),
          intent: this.dom.intentTag ? this.dom.intentTag.textContent : "N/A",
          phone: this.dom.leadPhone ? this.dom.leadPhone.textContent : "None",
          delivery: this.dom.leadDelivery ? this.dom.leadDelivery.textContent : "No",
          order_value: this.dom.orderValue ? this.dom.orderValue.textContent : "Rs. 0",
          exported_at: new Date().toISOString()
        };
        navigator.clipboard.writeText(JSON.stringify(record, null, 2)).then(() => {
          alert("Lead Telemetry copied to clipboard!");
        });
      });
    }
  }
}

// Auto-boot on module import
new LocalBizEngine();