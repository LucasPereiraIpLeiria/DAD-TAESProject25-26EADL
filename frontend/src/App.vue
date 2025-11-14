<template>
  <nav class="max-w-full p-5 flex flex-row justify-between align-middle">
    <div class="align-middle text-xl">
      <RouterLink :to="{name:'home'}">♠ PlayBisca</RouterLink><!-- TODO: Replace with router link to Home page -->
    </div>
    <NavigationMenu>
      <NavigationMenuList class="justify-around gap-20">
        <NavigationMenuItem>
          <NavigationMenuTrigger>Games</NavigationMenuTrigger>
          <NavigationMenuContent>
            <li>
              <NavigationMenuLink as-child>
                <RouterLink :to="{name:'singleplayer'}">SinglePlayer Game</RouterLink><!-- TODO: Replace with router link to Single Player Game page -->
              </NavigationMenuLink>
              <NavigationMenuLink>
                <RouterLink :to="$route.path">Multiplayer(coming soon)</RouterLink><!-- TODO: Replace with router link to Single Player Game page -->
              </NavigationMenuLink>
            </li>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  </nav>
  <div>
    <main>
      <RouterView/>
    </main>
  </div>
</template>

<script setup>
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import { RouterLink, RouterView } from 'vue-router';
</script>

<style></style>`
