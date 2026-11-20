using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection.Metadata;
using System.Reflection.PortableExecutable;
using System.Text.Json;

internal static class InspectPe
{
    private static string AttributeType(MetadataReader reader, CustomAttribute attribute)
    {
        EntityHandle handle = attribute.Constructor;
        EntityHandle parent;
        if (handle.Kind == HandleKind.MemberReference)
            parent = reader.GetMemberReference((MemberReferenceHandle)handle).Parent;
        else if (handle.Kind == HandleKind.MethodDefinition)
            parent = reader.GetMethodDefinition((MethodDefinitionHandle)handle).GetDeclaringType();
        else return "";
        if (parent.Kind == HandleKind.TypeReference)
        {
            TypeReference type = reader.GetTypeReference((TypeReferenceHandle)parent);
            return reader.GetString(type.Namespace) + "." + reader.GetString(type.Name);
        }
        if (parent.Kind == HandleKind.TypeDefinition)
        {
            TypeDefinition type = reader.GetTypeDefinition((TypeDefinitionHandle)parent);
            return reader.GetString(type.Namespace) + "." + reader.GetString(type.Name);
        }
        return "";
    }

    private static void Main(string[] args)
    {
        using FileStream stream = File.OpenRead(args[0]);
        using PEReader pe = new PEReader(stream);
        MetadataReader reader = pe.GetMetadataReader();
        AssemblyDefinition assembly = reader.GetAssemblyDefinition();
        string fileVersion = "";
        foreach (CustomAttributeHandle handle in assembly.GetCustomAttributes())
        {
            CustomAttribute attribute = reader.GetCustomAttribute(handle);
            if (AttributeType(reader, attribute) != "System.Reflection.AssemblyFileVersionAttribute") continue;
            BlobReader blob = reader.GetBlobReader(attribute.Value);
            if (blob.ReadUInt16() != 1) throw new InvalidDataException("Invalid attribute prolog");
            fileVersion = blob.ReadSerializedString();
        }
        var references = new List<object>();
        foreach (AssemblyReferenceHandle handle in reader.AssemblyReferences)
        {
            AssemblyReference item = reader.GetAssemblyReference(handle);
            references.Add(new { name = reader.GetString(item.Name), version = item.Version.ToString() });
        }
        CorFlags flags = pe.PEHeaders.CorHeader.Flags;
        Console.WriteLine(JsonSerializer.Serialize(new {
            assembly_name = reader.GetString(assembly.Name),
            assembly_version = assembly.Version.ToString(),
            file_version = fileVersion,
            runtime = reader.MetadataVersion,
            subsystem = pe.PEHeaders.PEHeader.Subsystem.ToString(),
            machine = pe.PEHeaders.CoffHeader.Machine.ToString(),
            il_only = (flags & CorFlags.ILOnly) != 0,
            requires_32_bit = (flags & CorFlags.Requires32Bit) != 0,
            prefers_32_bit = (flags & CorFlags.Prefers32Bit) != 0,
            references = references
        }));
    }
}
