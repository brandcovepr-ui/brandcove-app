


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$                                                                                                            
  begin                                                                                                                     
    insert into public.profiles (id, full_name, role)                                                                              
    values (                                                                                                                       
      new.id,                                                                                                                      
      new.raw_user_meta_data->>'full_name',                                                                                        
      coalesce(new.raw_user_meta_data->>'role', 'founder')                                                                         
    );                                                                                                                             
    return new;                                                                                                                    
  end;                                                                                                                             
  $$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."creative_profiles" (
    "id" "uuid" NOT NULL,
    "discipline" "text",
    "skills" "text"[],
    "portfolio_url" "text",
    "hourly_rate" numeric,
    "availability" "text" DEFAULT 'available'::"text",
    "location" "text",
    "years_experience" integer,
    "portfolio_links" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "review_notes" "text",
    "reviewed_at" timestamp with time zone,
    CONSTRAINT "creative_profiles_availability_check" CHECK (("availability" = ANY (ARRAY['available'::"text", 'busy'::"text", 'open_to_offers'::"text"])))
);


ALTER TABLE "public"."creative_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."founder_profiles" (
    "id" "uuid" NOT NULL,
    "company_name" "text",
    "industry" "text"[],
    "website_url" "text",
    "company_description" "text",
    "company_stage" "text",
    "creative_types_wanted" "text"[],
    CONSTRAINT "founder_profiles_company_stage_check" CHECK (("company_stage" = ANY (ARRAY['Pre-launch'::"text", 'Early stage'::"text", 'Growth'::"text", 'Established'::"text"])))
);


ALTER TABLE "public"."founder_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inquiries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "founder_id" "uuid",
    "creative_id" "uuid",
    "project_description" "text",
    "timeline" "text",
    "budget" numeric,
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "inquiries_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'declined'::"text", 'hired'::"text"])))
);


ALTER TABLE "public"."inquiries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "inquiry_id" "uuid",
    "sender_id" "uuid",
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."offers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "inquiry_id" "uuid",
    "founder_id" "uuid",
    "creative_id" "uuid",
    "terms" "text",
    "rate" numeric,
    "start_date" "date",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "offers_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'declined'::"text"])))
);


ALTER TABLE "public"."offers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "bio" "text",
    "subscription_status" "text" DEFAULT 'inactive'::"text",
    "subscription_plan" "text",
    "subscription_expires_at" timestamp with time zone,
    "paystack_customer_code" "text",
    "paystack_subscription_code" "text",
    "onboarding_complete" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "review_status" "text",
    CONSTRAINT "profiles_review_status_check" CHECK (("review_status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"]))),
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['founder'::"text", 'creative'::"text", 'admin'::"text"]))),
    CONSTRAINT "profiles_subscription_status_check" CHECK (("subscription_status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'grace_period'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shortlists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "founder_id" "uuid",
    "creative_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."shortlists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."work_samples" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "creative_id" "uuid" NOT NULL,
    "url" "text" NOT NULL,
    "title" "text",
    "file_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "work_samples_file_type_check" CHECK (("file_type" = ANY (ARRAY['image'::"text", 'pdf'::"text", 'video'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."work_samples" OWNER TO "postgres";


ALTER TABLE ONLY "public"."creative_profiles"
    ADD CONSTRAINT "creative_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."founder_profiles"
    ADD CONSTRAINT "founder_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inquiries"
    ADD CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shortlists"
    ADD CONSTRAINT "shortlists_founder_id_creative_id_key" UNIQUE ("founder_id", "creative_id");



ALTER TABLE ONLY "public"."shortlists"
    ADD CONSTRAINT "shortlists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."work_samples"
    ADD CONSTRAINT "work_samples_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_work_samples_creative" ON "public"."work_samples" USING "btree" ("creative_id");



ALTER TABLE ONLY "public"."creative_profiles"
    ADD CONSTRAINT "creative_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."founder_profiles"
    ADD CONSTRAINT "founder_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inquiries"
    ADD CONSTRAINT "inquiries_creative_id_fkey" FOREIGN KEY ("creative_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inquiries"
    ADD CONSTRAINT "inquiries_founder_id_fkey" FOREIGN KEY ("founder_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "public"."inquiries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_creative_id_fkey" FOREIGN KEY ("creative_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_founder_id_fkey" FOREIGN KEY ("founder_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "public"."inquiries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shortlists"
    ADD CONSTRAINT "shortlists_creative_id_fkey" FOREIGN KEY ("creative_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shortlists"
    ADD CONSTRAINT "shortlists_founder_id_fkey" FOREIGN KEY ("founder_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."work_samples"
    ADD CONSTRAINT "work_samples_creative_id_fkey" FOREIGN KEY ("creative_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Admin can update creative profiles" ON "public"."creative_profiles" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text")))));



CREATE POLICY "Creatives are publicly discoverable" ON "public"."profiles" FOR SELECT USING (("role" = 'creative'::"text"));



CREATE POLICY "Creatives can delete own profile" ON "public"."creative_profiles" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Creatives can insert own profile" ON "public"."creative_profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Creatives can manage own work samples" ON "public"."work_samples" USING (("auth"."uid"() = "creative_id"));



CREATE POLICY "Creatives can update own profile" ON "public"."creative_profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Creators can update inquiry status" ON "public"."inquiries" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "creative_id")) WITH CHECK (("auth"."uid"() = "creative_id"));



CREATE POLICY "Founder can create offer" ON "public"."offers" FOR INSERT WITH CHECK (("auth"."uid"() = "founder_id"));



CREATE POLICY "Founders are visible to authenticated users" ON "public"."profiles" FOR SELECT USING ((("role" = 'founder'::"text") AND ("auth"."role"() = 'authenticated'::"text")));



CREATE POLICY "Founders can create inquiries" ON "public"."inquiries" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "founder_id"));



CREATE POLICY "Offer access" ON "public"."offers" FOR SELECT USING ((("auth"."uid"() = "founder_id") OR ("auth"."uid"() = "creative_id")));



CREATE POLICY "Participants can update offer" ON "public"."offers" FOR UPDATE USING ((("auth"."uid"() = "founder_id") OR ("auth"."uid"() = "creative_id")));



CREATE POLICY "Users can view relevant inquiries" ON "public"."inquiries" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "founder_id") OR ("auth"."uid"() = "creative_id")));



CREATE POLICY "Work samples are public for viewing" ON "public"."work_samples" FOR SELECT USING (true);



CREATE POLICY "creative inquiries" ON "public"."inquiries" FOR SELECT USING (("auth"."uid"() = "creative_id"));



ALTER TABLE "public"."creative_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."founder_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inquiries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "inquiry messages" ON "public"."messages" USING ((("auth"."uid"() = "sender_id") OR (EXISTS ( SELECT 1
   FROM "public"."inquiries"
  WHERE (("inquiries"."id" = "messages"."inquiry_id") AND (("inquiries"."founder_id" = "auth"."uid"()) OR ("inquiries"."creative_id" = "auth"."uid"())))))));



ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."offers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "own founder profile" ON "public"."founder_profiles" USING (("auth"."uid"() = "id"));



CREATE POLICY "own profile" ON "public"."profiles" USING (("auth"."uid"() = "id"));



CREATE POLICY "own shortlists" ON "public"."shortlists" USING (("auth"."uid"() = "founder_id"));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "read creative profiles" ON "public"."creative_profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "read profiles" ON "public"."profiles" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



ALTER TABLE "public"."shortlists" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."work_samples" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";











































































































































































GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";
























GRANT ALL ON TABLE "public"."creative_profiles" TO "anon";
GRANT ALL ON TABLE "public"."creative_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."creative_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."founder_profiles" TO "anon";
GRANT ALL ON TABLE "public"."founder_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."founder_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."inquiries" TO "anon";
GRANT ALL ON TABLE "public"."inquiries" TO "authenticated";
GRANT ALL ON TABLE "public"."inquiries" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."offers" TO "anon";
GRANT ALL ON TABLE "public"."offers" TO "authenticated";
GRANT ALL ON TABLE "public"."offers" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."shortlists" TO "anon";
GRANT ALL ON TABLE "public"."shortlists" TO "authenticated";
GRANT ALL ON TABLE "public"."shortlists" TO "service_role";



GRANT ALL ON TABLE "public"."work_samples" TO "anon";
GRANT ALL ON TABLE "public"."work_samples" TO "authenticated";
GRANT ALL ON TABLE "public"."work_samples" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Authenticated users can upload work samples"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'work-samples'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Avatar images are publicly viewable"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'avatars'::text));



  create policy "Creatives can delete own work samples"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'work-samples'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Creatives can update own work samples"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'work-samples'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users can delete their own avatar"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users can update their own avatar"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users can upload their own avatar"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



