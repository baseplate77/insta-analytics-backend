class JobQueue {
  queue: any[] = [];
  processing = false;
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  // Add a new job to the queue
  addJob(jobFunction: any) {
    this.queue.push(jobFunction);
    this.processNext();
  }

  // Process the next job in the queue
  async processNext() {
    if (this.processing) return;
    if (this.queue.length === 0) return;

    this.processing = true;
    const job = this.queue.shift(); // Get the next job

    try {
      await job();
    } catch (error) {
      console.error("Error processing job:", error);
    } finally {
      this.processing = false;
      this.processNext(); // Process the next job in the queue
    }
  }

  // Get the number of jobs in the queue
  getQueueLength() {
    return this.queue.length;
  }

  // Get a snapshot of the current queue
  getQueueSnapshot() {
    return [...this.queue];
  }
}
const jobQueue = new JobQueue();

export default jobQueue;
