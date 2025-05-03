<script lang="ts">
	import { onMount } from 'svelte';
	import { Search } from '$lib/index.js';
	import { parse } from '$lib/parsers/index.js';
	import { toQuery } from '$lib/query.js';

	let editorContainer: HTMLDivElement;

	
	onMount(() => {
		const collections = new Map()
		collections.set('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', {name: 'Workshop', id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'})
		collections.set('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaab', {name: 'Bridge', id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaab'})
		collections.set('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaac', {name: 'Study', id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaac'})
        
		// search.setCollections(collections)
        const search = new Search({
			element: editorContainer, 
			collections,
			onChange: (query) => {
			const parsed = parse(query)

			// TODO: note that we could use parsed.keywords instead of parsed segments
			console.log(toQuery(parsed))

		} })
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
	:global(.cm-qs-keyword) { color:#268bd2; font-weight:600; }
	:global(.cm-qs-arg)     { color:#586e75; }
	:global(.cm-qs-ignored) { color:#93a1a1 !important; }   /* gray entire duplicate line */
</style>
