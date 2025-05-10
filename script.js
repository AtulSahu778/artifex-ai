const API_KEY = "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";

const DOM = {
  promptForm: document.querySelector(".prompt-form"),
  themeToggle: document.querySelector(".theme-toggle"),
  promptBtn: document.querySelector(".prompt-btn"),
  promptInput: document.querySelector(".prompt-input"),
  generateBtn: document.querySelector(".generate-btn"),
  galleryGrid: document.querySelector(".gallery-grid"),
  modelSelect: document.getElementById("model-select"),
  countSelect: document.getElementById("count-select"),
  ratioSelect: document.getElementById("ratio-select")
};

const examplePrompts = [
  "A magic forest with glowing plants and fairy homes among giant mushrooms",
  "An old steampunk airship floating through golden clouds at sunset",
  "A future Mars colony with glass domes and gardens against red mountains",
  "A dragon sleeping on gold coins in a crystal cave",
  "An underwater kingdom with merpeople and glowing coral buildings",
  "A floating island with waterfalls pouring into clouds below",
  "A witch's cottage in fall with magic herbs in the garden",
  "A robot painting in a sunny studio with art supplies around it",
  "A magical library with floating glowing books and spiral staircases",
  "A Japanese shrine during cherry blossom season with lanterns and misty mountains",
  "A cosmic beach with glowing sand and an aurora in the night sky",
  "A medieval marketplace with colorful tents and street performers",
  "A cyberpunk city with neon signs and flying cars at night",
  "A peaceful bamboo forest with a hidden ancient temple",
  "A giant turtle carrying a village on its back in the ocean"
];

(() => {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
  const savedTheme = localStorage.getItem("theme") || (prefersDark.matches ? "dark" : "light");
  
  const setTheme = (isDark) => {
    document.body.classList.toggle("dark-theme", isDark);
    DOM.themeToggle.querySelector("i").className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
  };

  setTheme(savedTheme === "dark");
  
  prefersDark.addEventListener("change", (e) => {
    if (!localStorage.getItem("theme")) {
      setTheme(e.matches);
    }
  });
})();

const toggleTheme = () => {
  const isDarkTheme = document.body.classList.toggle("dark-theme");
  localStorage.setItem("theme", isDarkTheme ? "dark" : "light");
  DOM.themeToggle.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
};

const getImageDimensions = (aspectRatio, baseSize = 512) => {
  const [width, height] = aspectRatio.split("/").map(Number);
  const scaleFactor = baseSize / Math.sqrt(width * height);
  return {
    width: Math.floor(width * scaleFactor / 16) * 16,
    height: Math.floor(height * scaleFactor / 16) * 16
  };
};

const updateImageCard = (index, imageUrl) => {
  const imgCard = document.getElementById(`img-card-${index}`);
  if (!imgCard) return;
  
  imgCard.classList.remove("loading");
  imgCard.innerHTML = `
    <img class="result-img" src="${imageUrl}" loading="lazy" />
    <div class="img-overlay">
      <a href="${imageUrl}" class="img-download-btn" title="Download Image" download>
        <i class="fa-solid fa-download"></i>
      </a>
    </div>`;
};

const generateImages = async (selectedModel, imageCount, aspectRatio, promptText) => {
  const MODEL_URL = `https://api-inference.huggingface.co/models/${selectedModel}`;
  const { width, height } = getImageDimensions(aspectRatio);
  
  DOM.generateBtn.setAttribute("disabled", "true");
  
  try {
    const requests = Array.from({ length: imageCount }, async (_, i) => {
      try {
        const response = await fetch(MODEL_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
            "x-use-cache": "false",
          },
          body: JSON.stringify({
            inputs: promptText,
            parameters: { width, height },
          }),
        });

        if (!response.ok) {
          throw new Error((await response.json())?.error || "API request failed");
        }

        const blob = await response.blob();
        updateImageCard(i, URL.createObjectURL(blob));
      } catch (error) {
        console.error(`Error generating image ${i + 1}:`, error);
        const imgCard = document.getElementById(`img-card-${i}`);
        if (imgCard) {
          imgCard.classList.replace("loading", "error");
          imgCard.querySelector(".status-text").textContent = "Generation failed! Check console for details.";
        }
      }
    });

    await Promise.allSettled(requests);
  } finally {
    DOM.generateBtn.removeAttribute("disabled");
  }
};

const createImageCards = (selectedModel, imageCount, aspectRatio, promptText) => {
  DOM.galleryGrid.innerHTML = Array.from({ length: imageCount }, (_, i) => `
    <div class="img-card loading" id="img-card-${i}" style="aspect-ratio: ${aspectRatio}">
      <div class="status-container">
        <div class="spinner"></div>
        <i class="fa-solid fa-triangle-exclamation"></i>
        <p class="status-text">Generating...</p>
      </div>
    </div>`
  ).join("");

  requestAnimationFrame(() => {
    document.querySelectorAll(".img-card").forEach((card, i) => {
      setTimeout(() => card.classList.add("animate-in"), 100 * i);
    });
  });

  generateImages(selectedModel, imageCount, aspectRatio, promptText);
};

const typePrompt = (prompt) => {
  let i = 0;
  DOM.promptInput.value = "";
  DOM.promptInput.focus();
  DOM.promptBtn.disabled = true;
  DOM.promptBtn.style.opacity = "0.5";

  const chunk = 3;
  const typeChunk = () => {
    if (i < prompt.length) {
      DOM.promptInput.value += prompt.slice(i, i + chunk);
      i += chunk;
      requestAnimationFrame(typeChunk);
    } else {
      DOM.promptBtn.disabled = false;
      DOM.promptBtn.style.opacity = "0.8";
    }
  };

  requestAnimationFrame(typeChunk);
};

DOM.promptBtn.addEventListener("click", () => {
  const prompt = examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
  typePrompt(prompt);
});

DOM.themeToggle.addEventListener("click", toggleTheme);

DOM.promptForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const selectedModel = DOM.modelSelect.value;
  const imageCount = parseInt(DOM.countSelect.value) || 1;
  const aspectRatio = DOM.ratioSelect.value || "1/1";
  const promptText = DOM.promptInput.value.trim();
  
  if (promptText && selectedModel) {
    createImageCards(selectedModel, imageCount, aspectRatio, promptText);
  }
});
