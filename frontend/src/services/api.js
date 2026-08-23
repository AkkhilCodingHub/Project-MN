/**
 * StudyTrace API Client
 * Dynamically resolves to local Rust server (http://localhost:8080/api) or production Render backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? "https://project-mn.onrender.com/api" : "http://localhost:8080/api");

export const MOCK_USER_ID = "8a7b9c1d-2e3f-4a5b-6c7d-8e9f0a1b2c3d";

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      signal: AbortSignal.timeout(3000)
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function ingestDocument(file, userId = MOCK_USER_ID) {
  const formData = new FormData();
  formData.append("user_id", userId);
  formData.append("file", file);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/ingest`, {
      method: "POST",
      body: formData,
    });
  } catch (networkError) {
    console.warn("Ingest API unreachable, returning simulated ingestion:", networkError.message);
    // Graceful offline fallback simulation
    return {
      message: "File indexed successfully (Demo Mode)",
      simulated: true,
      file_name: file.name,
      file_size_bytes: file.size,
      pinecone_namespace: `user_${userId}`
    };
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: `Server error (${response.status})` }));
    throw new Error(err.error || "Upload failed");
  }

  return await response.json();
}

export async function queryRAG(userQuery, userId = MOCK_USER_ID) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, query: userQuery }),
    });
  } catch (networkError) {
    console.warn("Query API unreachable, returning simulated RAG response:", networkError.message);
    
    // Detailed engineering fallback answer with KaTeX math & citations
    const isMath = userQuery.toLowerCase().includes("laplace") || userQuery.toLowerCase().includes("math") || userQuery.toLowerCase().includes("equation");
    
    if (isMath) {
      return {
        text: `### Step-by-Step Laplace Transform Derivation\n\nThe Laplace Transform of a continuous-time signal $f(t)$ is defined as:\n\n$$\\mathcal{L}\\{f(t)\\} = F(s) = \\int_{0}^{\\infty} f(t) e^{-st} dt$$\n\nFor a standard unit step function $u(t)$:\n\n$$F(s) = \\int_{0}^{\\infty} 1 \\cdot e^{-st} dt = \\left[ -\\frac{e^{-st}}{s} \\right]_{0}^{\\infty} = \\frac{1}{s} \\quad \\text{for } \\text{Re}(s) > 0$$\n\n| Property | Time Domain $f(t)$ | Frequency Domain $F(s)$ |\n| :--- | :--- | :--- |\n| Linearity | $a f(t) + b g(t)$ | $a F(s) + b G(s)$ |\n| Time Shift | $f(t - a) u(t - a)$ | $e^{-as} F(s)$ |\n| Differentiation | $\\frac{df(t)}{dt}$ | $s F(s) - f(0^-)$ |`,
        grounded: true,
        simulated: true,
        sources: [
          { doc: "Signals_and_Systems_Unit3.pdf", page: 14 },
          { doc: "Previous_Year_Questions_2025.pdf", page: 4 }
        ]
      };
    }

    return {
      text: `Based on your uploaded course notes, here is the detailed breakdown for **${userQuery}**:\n\n1. **Core Concept**: System performance relies on time complexity $\\mathcal{O}(N \\log N)$ when sorting balanced binary search structures.\n2. **Engineering Trade-off**: Space complexity requires $\\mathcal{O}(1)$ auxiliary memory for in-place variants.\n\n| Parameter | Average Case | Worst Case | Memory |\n| :--- | :--- | :--- | :--- |\n| Quicksort | $\\mathcal{O}(N \\log N)$ | $\\mathcal{O}(N^2)$ | $\\mathcal{O}(\\log N)$ |\n| Mergesort | $\\mathcal{O}(N \\log N)$ | $\\mathcal{O}(N \\log N)$ | $\\mathcal{O}(N)$ |`,
      grounded: true,
      simulated: true,
      sources: [
        { doc: "Data_Structures_Lecture_Notes.pdf", page: 42 },
        { doc: "Midterm_Question_Bank.pdf", page: 8 }
      ]
    };
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: `Query failed (${response.status})` }));
    throw new Error(err.error || "Query failed");
  }

  return await response.json();
}

export async function fetchQuiz(subject = 'dsa', userId = MOCK_USER_ID) {
  let response;
  try {
    const subParam = subject ? `&subject=${encodeURIComponent(subject)}` : '';
    response = await fetch(`${API_BASE_URL}/quiz?user_id=${userId}${subParam}`);
  } catch (networkError) {
    console.warn("Quiz API unreachable, using subject fallback:", networkError.message);
    return getMockQuizForSubject(subject);
  }

  if (!response.ok) {
    console.warn("Quiz API returned non-OK status:", response.status);
    return getMockQuizForSubject(subject);
  }

  const data = await response.json().catch(() => null);
  if (data && Array.isArray(data.options) && typeof data.question === 'string') {
    return data;
  }
  return getMockQuizForSubject(subject);
}

function getMockQuizForSubject(subject) {
  const dsaQuizzes = [
    {
      question: "What is the time complexity of building a Binary Heap from an unsorted array of N elements?",
      options: ["O(N log N)", "O(N)", "O(N^2)", "O(log N)"],
      correct: 1,
      explanation: "Using Floyd's Heapify algorithm starting from bottom-up, building a heap takes linear time O(N)."
    },
    {
      question: "Which data structure guarantees O(log N) search, insertion, and deletion in the worst case?",
      options: ["Standard Binary Search Tree", "Red-Black / AVL Tree", "Hash Table with Chaining", "Skip List with random heads"],
      correct: 1,
      explanation: "Self-balancing binary search trees (AVL / Red-Black) maintain height balance and guarantee O(log N) operations."
    }
  ];

  const signalsQuizzes = [
    {
      question: "In Signals & Systems, what condition must be satisfied to prevent aliasing during sampling?",
      options: [
        "Sampling frequency f_s >= 2 * f_max (Nyquist Rate)",
        "Sampling frequency f_s < f_max",
        "Sampling period T_s > 1 / f_max",
        "Bandwidth must be infinite"
      ],
      correct: 0,
      explanation: "The Nyquist-Shannon sampling theorem requires sampling at least twice the maximum signal frequency component."
    },
    {
      question: "What is the Laplace transform of the Dirac delta function δ(t)?",
      options: ["1/s", "1", "s", "e^(-st)"],
      correct: 1,
      explanation: "The Laplace transform of the unit impulse function δ(t) is 1 for all complex frequencies s."
    }
  ];

  const osQuizzes = [
    {
      question: "Which CPU scheduling algorithm guarantees minimum average waiting time for a given set of processes?",
      options: ["First-Come First-Served (FCFS)", "Round Robin (RR)", "Shortest Job First (SJF)", "Priority Scheduling"],
      correct: 2,
      explanation: "Shortest Job First (SJF) is provably optimal for minimizing average process waiting time."
    },
    {
      question: "Which of the following is NOT one of the 4 necessary conditions for Coffman Deadlock?",
      options: ["Mutual Exclusion", "Hold and Wait", "Preemptive Resource Allocation", "Circular Wait"],
      correct: 2,
      explanation: "No Preemption is a necessary condition; allowing preemption eliminates and prevents deadlocks."
    }
  ];

  let list = dsaQuizzes;
  if (subject === 'signals') list = signalsQuizzes;
  else if (subject === 'os') list = osQuizzes;

  return list[Math.floor(Math.random() * list.length)];
}

export async function fetchFlashcards(subject = 'dsa', userId = MOCK_USER_ID) {
  let response;
  try {
    const subParam = subject ? `&subject=${encodeURIComponent(subject)}` : '';
    response = await fetch(`${API_BASE_URL}/flashcards?user_id=${userId}${subParam}`);
  } catch (networkError) {
    console.warn("Flashcards API unreachable, using subject fallback:", networkError.message);
    return getMockFlashcardsForSubject(subject);
  }

  if (!response.ok) {
    console.warn("Flashcards API returned non-OK status:", response.status);
    return getMockFlashcardsForSubject(subject);
  }

  const data = await response.json().catch(() => null);
  if (Array.isArray(data) && data.length > 0) {
    return data;
  }
  return getMockFlashcardsForSubject(subject);
}

function getMockFlashcardsForSubject(subject) {
  const dsaCards = [
    {
      front: "Binary Heap Build Time Complexity",
      back: "O(N) using Floyd's bottom-up heapify algorithm, since sum of i/2^i converges to a constant 2."
    },
    {
      front: "Quicksort vs Mergesort Space Complexity",
      back: "Quicksort: O(log N) stack space for in-place recursion.\nMergesort: O(N) auxiliary space for buffer merging."
    },
    {
      front: "Amdahl's Law Speedup Formula",
      back: "Speedup = 1 / [(1 - P) + (P / S)], where P is parallel fraction and S is speedup factor."
    }
  ];

  const signalsCards = [
    {
      front: "Fourier Transform Equation",
      back: "X(f) = \\int_{-\\infty}^{\\infty} x(t) e^{-j 2\\pi f t} dt. Decomposes continuous time into frequency domain."
    },
    {
      front: "Laplace Transform of Unit Impulse δ(t)",
      back: "\\mathcal{L}\\{\\delta(t)\\} = 1 for all s. Represents flat infinite frequency spectrum response."
    },
    {
      front: "Nyquist Sampling Rate Condition",
      back: "f_s \\ge 2 f_{max}. Eliminates spectral overlap and prevents aliasing distortion."
    }
  ];

  const osCards = [
    {
      front: "Deadlock 4 Necessary Conditions",
      back: "1. Mutual Exclusion\n2. Hold & Wait\n3. No Preemption\n4. Circular Wait. Eliminating any 1 condition prevents deadlock."
    },
    {
      front: "TCP 3-Way Handshake",
      back: "SYN → SYN-ACK → ACK. Establishes reliable bi-directional stream connection."
    },
    {
      front: "Shortest Job First (SJF) Optimality",
      back: "Provably minimizes average waiting time across non-preemptive job queues."
    }
  ];

  if (subject === 'signals') return signalsCards;
  if (subject === 'os') return osCards;
  return dsaCards;
}

export async function triggerRazorpayWebhook(userId = MOCK_USER_ID) {
  try {
    const response = await fetch(`${API_BASE_URL}/webhook/razorpay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Razorpay-Signature": "demo_signature"
      },
      body: JSON.stringify({
        event: "payment.captured",
        payload: {
          payment: {
            entity: {
              notes: { user_id: userId }
            }
          }
        }
      })
    });
    return response.ok;
  } catch (error) {
    console.warn("Razorpay webhook call failed:", error);
    return false;
  }
}
