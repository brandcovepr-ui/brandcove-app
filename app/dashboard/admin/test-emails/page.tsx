'use server'



import { notifyCreatorApplication, notifyInquiry , notifyMessage,
notifyOffer,
notifyHire,
notifyReviewDecision,} from '@/lib/email/notifications'

// Server Actions to test each notification function
async function testCreatorApplication(formData: FormData) {
  'use server'
  const creativeId = formData.get('creativeId') as string
  try {
    await notifyCreatorApplication(creativeId)
    return { success: true, message: `Application email sent for ${creativeId}` }
  } catch (err: any) {
    return { success: false, message: err.message }
  }
}

async function testInquiry(formData: FormData) {
  'use server'
  const inquiryId = formData.get('inquiryId') as string
  const founderId = formData.get('founderId') as string
  try {
    await notifyInquiry(inquiryId, founderId)
    return { success: true, message: `Inquiry email sent for ${inquiryId}` }
  } catch (err: any) {
    return { success: false, message: err.message }
  }
}

async function testMessage(formData: FormData) {
  'use server'
  const inquiryId = formData.get('inquiryId') as string
  const senderId = formData.get('senderId') as string
  const preview = (formData.get('preview') as string) || 'Test message preview'
  try {
    await notifyMessage(inquiryId, senderId, preview)
    return { success: true, message: `Message email sent from ${senderId}` }
  } catch (err: any) {
    return { success: false, message: err.message }
  }
}

async function testOffer(formData: FormData) {
  'use server'
  const inquiryId = formData.get('inquiryId') as string
  const creativeId = formData.get('creativeId') as string
  const action = formData.get('action') as 'accepted' | 'declined'
  try {
    await notifyOffer(inquiryId, creativeId, action)
    return { success: true, message: `Offer ${action} email sent` }
  } catch (err: any) {
    return { success: false, message: err.message }
  }
}

async function testHire(formData: FormData) {
  'use server'
  const inquiryId = formData.get('inquiryId') as string
  const founderId = formData.get('founderId') as string
  try {
    await notifyHire(inquiryId, founderId)
    return { success: true, message: `Hire confirmation emails sent` }
  } catch (err: any) {
    return { success: false, message: err.message }
  }
}

async function testReviewDecision(formData: FormData) {
  'use server'
  const creativeId = formData.get('creativeId') as string
  const status = formData.get('status') as 'approved' | 'rejected'
  const denialReason = (formData.get('denialReason') as string) || undefined
  try {
    await notifyReviewDecision(creativeId, status, denialReason)
    return { success: true, message: `Review decision (${status}) email sent` }
  } catch (err: any) {
    return { success: false, message: err.message }
  }
}

export default async function EmailTestPage() {
  return (
    <div className="max-w-4xl mx-auto p-8 font-sans space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Email Notifications Testbed</h1>
        <p className="text-sm text-gray-500">
          Trigger real Resend emails by passing mock/real database IDs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Creator Application */}
        <section className="p-4 border rounded-lg shadow-sm space-y-3">
          <h2 className="font-semibold text-lg">1. Notify Creator Application</h2>
          <form action={testCreatorApplication} className="space-y-2">
            <input
              name="creativeId"
              placeholder="Creative User ID (UUID)"
              required
              className="w-full p-2 border rounded text-sm"
            />
            <button type="submit" className="px-4 py-2 bg-black text-white rounded text-sm w-full">
              Send Application Email
            </button>
          </form>
        </section>

        {/* 2. Inquiry Notification */}
        <section className="p-4 border rounded-lg shadow-sm space-y-3">
          <h2 className="font-semibold text-lg">2. Notify Inquiry</h2>
          <form action={testInquiry} className="space-y-2">
            <input
              name="inquiryId"
              placeholder="Inquiry ID (UUID)"
              required
              className="w-full p-2 border rounded text-sm"
            />
            <input
              name="founderId"
              placeholder="Founder User ID (UUID)"
              required
              className="w-full p-2 border rounded text-sm"
            />
            <button type="submit" className="px-4 py-2 bg-black text-white rounded text-sm w-full">
              Send Inquiry Email
            </button>
          </form>
        </section>

        {/* 3. New Message */}
        <section className="p-4 border rounded-lg shadow-sm space-y-3">
          <h2 className="font-semibold text-lg">3. Notify Message</h2>
          <form action={testMessage} className="space-y-2">
            <input
              name="inquiryId"
              placeholder="Inquiry ID (UUID)"
              required
              className="w-full p-2 border rounded text-sm"
            />
            <input
              name="senderId"
              placeholder="Sender User ID (UUID)"
              required
              className="w-full p-2 border rounded text-sm"
            />
            <input
              name="preview"
              placeholder="Message Preview (optional)"
              className="w-full p-2 border rounded text-sm"
            />
            <button type="submit" className="px-4 py-2 bg-black text-white rounded text-sm w-full">
              Send Message Email
            </button>
          </form>
        </section>

        {/* 4. Offer Action */}
        <section className="p-4 border rounded-lg shadow-sm space-y-3">
          <h2 className="font-semibold text-lg">4. Notify Offer Action</h2>
          <form action={testOffer} className="space-y-2">
            <input
              name="inquiryId"
              placeholder="Inquiry ID (UUID)"
              required
              className="w-full p-2 border rounded text-sm"
            />
            <input
              name="creativeId"
              placeholder="Creative User ID (UUID)"
              required
              className="w-full p-2 border rounded text-sm"
            />
            <select name="action" className="w-full p-2 border rounded text-sm bg-white">
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
            </select>
            <button type="submit" className="px-4 py-2 bg-black text-white rounded text-sm w-full">
              Send Offer Status Email
            </button>
          </form>
        </section>

        {/* 5. Hire Confirmation */}
        <section className="p-4 border rounded-lg shadow-sm space-y-3">
          <h2 className="font-semibold text-lg">5. Notify Hire</h2>
          <form action={testHire} className="space-y-2">
            <input
              name="inquiryId"
              placeholder="Inquiry ID (UUID)"
              required
              className="w-full p-2 border rounded text-sm"
            />
            <input
              name="founderId"
              placeholder="Founder User ID (UUID)"
              required
              className="w-full p-2 border rounded text-sm"
            />
            <button type="submit" className="px-4 py-2 bg-black text-white rounded text-sm w-full">
              Send Dual Hire Emails
            </button>
          </form>
        </section>

        {/* 6. Review Decision */}
        <section className="p-4 border rounded-lg shadow-sm space-y-3">
          <h2 className="font-semibold text-lg">6. Notify Review Decision</h2>
          <form action={testReviewDecision} className="space-y-2">
            <input
              name="creativeId"
              placeholder="Creative User ID (UUID)"
              required
              className="w-full p-2 border rounded text-sm"
            />
            <select name="status" className="w-full p-2 border rounded text-sm bg-white">
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <textarea
              name="denialReason"
              placeholder="Denial Reason (optional)"
              className="w-full p-2 border rounded text-sm h-16"
            />
            <button type="submit" className="px-4 py-2 bg-black text-white rounded text-sm w-full">
              Send Review Email
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}