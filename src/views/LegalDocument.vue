<template>
  <v-container class="legal-document">
    <v-card class="mx-auto pa-6" max-width="900">
      <v-btn
        icon
        @click="goBack"
        class="mb-4"
      >
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>

      <div v-if="loading" class="text-center py-10">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </div>

      <div v-else-if="error" class="text-center py-10">
        <v-icon size="64" color="error">mdi-alert-circle</v-icon>
        <h2 class="mt-4">Document Not Found</h2>
        <p>{{ error }}</p>
      </div>

      <div v-else v-html="content" class="markdown-content"></div>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const content = ref('');
const loading = ref(true);
const error = ref(null);

const documentMap = {
  privacy: '/documents/privacy-policy.md',
  terms: '/documents/terms-of-service.md',
  cookies: '/documents/cookie-policy.md',
  'acceptable-use': '/documents/acceptable-use-policy.md',
  'data-deletion': '/documents/data-deletion-request.md',
};

const goBack = () => {
  router.back();
};

const loadDocument = async () => {
  const docType = route.meta.docType;
  const docPath = documentMap[docType];

  if (!docPath) {
    error.value = `Unknown document type: ${docType}`;
    loading.value = false;
    return;
  }

  try {
    const response = await fetch(docPath);
    if (!response.ok) {
      throw new Error('Document not found');
    }

    const markdown = await response.text();
    // Simple markdown to HTML conversion (for production, use a proper markdown parser)
    content.value = parseMarkdown(markdown);
  } catch (err) {
    error.value = `Failed to load document: ${err.message}`;
  } finally {
    loading.value = false;
  }
};

// Simple markdown parser (basic implementation)
const parseMarkdown = (md) => {
  let html = md;

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');

  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // Lists
  html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  html = `<p>${html}</p>`;

  // Line breaks
  html = html.replace(/\n/g, '<br>');

  return html;
};

onMounted(() => {
  loadDocument();
});
</script>

<style scoped>
.legal-document {
  padding: 20px;
  min-height: 100vh;
}

.markdown-content {
  line-height: 1.8;
  color: var(--text-primary);
}

.markdown-content h1 {
  font-size: 2.5rem;
  margin: 30px 0 20px;
  color: var(--text-primary);
}

.markdown-content h2 {
  font-size: 1.8rem;
  margin: 25px 0 15px;
  color: var(--text-primary);
  border-bottom: 2px solid var(--border-color);
  padding-bottom: 10px;
}

.markdown-content h3 {
  font-size: 1.3rem;
  margin: 20px 0 10px;
  color: var(--text-secondary);
}

.markdown-content p {
  margin: 15px 0;
}

.markdown-content ul {
  margin: 15px 0 15px 30px;
}

.markdown-content li {
  margin: 8px 0;
}

.markdown-content a {
  color: var(--primary-color);
  text-decoration: none;
}

.markdown-content a:hover {
  text-decoration: underline;
}

.markdown-content strong {
  font-weight: 600;
  color: var(--text-primary);
}

.markdown-content table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
}

.markdown-content table th,
.markdown-content table td {
  border: 1px solid var(--border-color);
  padding: 12px;
  text-align: left;
}

.markdown-content table th {
  background: var(--background-secondary);
  font-weight: 600;
}
</style>
