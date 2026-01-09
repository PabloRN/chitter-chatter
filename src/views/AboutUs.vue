<template>
    <v-container class="about-us">
        <v-card class="mx-auto pa-6" max-width="900">
            <v-btn icon @click="goBack" class="mb-4">
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
import { useRouter } from 'vue-router';

const router = useRouter();
const content = ref('');
const loading = ref(true);
const error = ref(null);

const goBack = () => {
    router.back();
};

const loadDocument = async () => {
    try {
        const response = await fetch('/documents/about-us.md');
        if (!response.ok) {
            throw new Error('Document not found');
        }

        const markdown = await response.text();
        content.value = parseMarkdown(markdown);
    } catch (err) {
        error.value = `Failed to load document: ${err.message}`;
    } finally {
        loading.value = false;
    }
};

// Simple markdown parser (reusing from LegalDocument.vue)
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
.about-us {
    padding: 20px;
    min-height: 100vh;
}

.markdown-content {
    line-height: 1.8;
    color: var(--text-primary);
}

.markdown-content :deep(h1) {
    font-size: 2.5rem;
    margin: 30px 0 20px;
    color: var(--text-primary);
}

.markdown-content :deep(h2) {
    font-size: 1.8rem;
    margin: 25px 0 15px;
    color: var(--text-primary);
    border-bottom: 2px solid var(--border-color);
    padding-bottom: 10px;
}

.markdown-content :deep(h3) {
    font-size: 1.3rem;
    margin: 20px 0 10px;
    color: var(--text-secondary);
}

.markdown-content :deep(p) {
    margin: 15px 0;
}

.markdown-content :deep(ul) {
    margin: 15px 0 15px 30px;
}

.markdown-content :deep(li) {
    margin: 8px 0;
}

.markdown-content :deep(a) {
    color: var(--primary-color);
    text-decoration: none;
}

.markdown-content :deep(a:hover) {
    text-decoration: underline;
}

.markdown-content :deep(strong) {
    font-weight: 600;
    color: var(--text-primary);
}
</style>
