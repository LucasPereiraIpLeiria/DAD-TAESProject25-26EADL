<template>
  <div class="not-found-container">
    <div class="card">
      <div class="error-code">404</div>
      <h2>Oops!</h2>
      <p>We couldn't find what you were looking for.</p>

      <div class="button-group">
        <button @click="goHome" class="btn btn-primary">Go Home</button>
        <button @click="goBack" class="btn btn-secondary">Go Back</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotFoundPage',
  methods: {
    goHome() {
      this.$router.push({ name: 'home' })
    },
    goBack() {
      this.$router.back()
    }
  }
}
</script>

<style scoped>
.not-found-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 60px 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.header h1 {
  font-size: 36px;
  color: #1a1a1a;
  margin-bottom: 12px;
  font-weight: 600;
}

.header p {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.card {
  max-width: 600px;
  margin: 0 auto;
  padding: 60px 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  text-align: center;
}

.error-code {
  font-size: 100px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 20px;
  line-height: 1;
  opacity: 0.9;
}

.card h2 {
  font-size: 28px;
  color: #1a1a1a;
  margin-bottom: 12px;
  font-weight: 600;
}

.card p {
  font-size: 16px;
  color: #666;
  margin-bottom: 40px;
}

.button-group {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 12px 32px;
  font-size: 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  min-width: 150px;
}

.btn-primary {
  background: #1a1a2e;
  color: white;
}

.btn-primary:hover {
  background: #0f0f1e;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-secondary {
  background: #f0f0f0;
  color: #1a1a1a;
  border: 1px solid #e0e0e0;
}

.btn-secondary:hover {
  background: #f9f9f9;
  border-color: #d0d0d0;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
</style>
