<script lang="ts">
	import { onMount } from 'svelte';
	import { Search } from '$lib/index.js';

	let editorContainer: HTMLDivElement;

	
	onMount(() => {
        const search = new Search({element: editorContainer, onChange: console.log })
        search.setCollections(['collection 1', 'collection 2', 'collection 3'].map(c => ({id: c, name: c})))
	});
</script>

<div class="flex flex-grow relative">
	<!-- CodeMirror will mount here -->
	<div
		class="input-outlined px-2 py-1 bg-white rounded-md flex-grow text-sm"
		bind:this={editorContainer}
		aria-label="Search"
	></div>
</div>

<style>
    /* style your highlighted @keywords */
    :global(.cm-atKeyword) {
        color: #0070f3;
        font-weight: 600;
    }
</style>
